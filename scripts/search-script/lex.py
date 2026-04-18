import os
import re
import json
import argparse
import math
from collections import Counter, defaultdict
from typing import Tuple, Dict, Any, List

# Optional dependency:
#   pip install jieba
try:
    import jieba  # type: ignore
except Exception:
    jieba = None


def _load_lines_set(path_: str) -> set:
    """Load a file as a set of lines, ignoring empty lines and comments."""
    s = set()
    try:
        with open(path_, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                s.add(line)
                s.add(line.lower())
    except OSError:
        return set()
    return s


def _load_english_words(path_: str) -> set:
    """Load English dictionary file (one word per line)."""
    s = set()
    try:
        with open(path_, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                word = line.strip().lower()
                if word and len(word) >= 2:
                    s.add(word)
    except OSError:
        return set()
    return s


def _load_jieba_dict(path_: str) -> set:
    """Load jieba dictionary format: word [freq] [tag]."""
    s = set()
    try:
        with open(path_, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                # Format: word [freq] [tag] - we only need the word
                parts = line.split()
                if parts:
                    s.add(parts[0])
    except OSError:
        return set()
    return s


def _load_ignore_lists(path_: str) -> tuple[set, set]:
    ignored_basenames = set()
    ignored_relpaths = set()
    try:
        with open(path_, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                norm = line.replace("\\", "/").lstrip("./")
                ignored_basenames.add(os.path.basename(norm))
                ignored_relpaths.add(norm)
    except OSError:
        return set(), set()
    return ignored_basenames, ignored_relpaths


def _make_tokenizer(
    *,
    use_jieba: bool,
    keep_punctuation: bool,
    lowercase_ascii: bool,
    min_ascii_len: int,
    min_token_len: int,
    stopwords: set,
    user_dict_path: str = "",
    english_dict_path: str = "",
    chinese_dict_set: set = None,
    english_dict_set: set = None,
):
    """
    Create a tokenizer function that handles both English and Chinese text.
    
    For Chinese:
    - Uses jieba with cut_all=False (accurate mode) for proper word segmentation
    - Supports custom user dictionary for domain-specific terms
    - Falls back to character-by-character if jieba is not available
    - Validates against Chinese dictionary for proper word recognition
    
    For English:
    - Matches words with optional apostrophes (e.g., "don't")
    - Matches numbers with optional decimals
    - Validates against English dictionary for proper word recognition
    """
    cjk_re = re.compile(r"[\u4e00-\u9fff]")
    en_token_re = re.compile(
        r"[A-Za-z]+(?:'[A-Za-z]+)?"
        r"|[0-9]+(?:\.[0-9]+)?"
        r"|[^\s]"
    )
    ascii_word_re = re.compile(r"^[A-Za-z]+(?:'[A-Za-z]+)?$")
    
    # Use pre-loaded dictionary sets if provided
    chinese_dict = chinese_dict_set if chinese_dict_set is not None else set()
    english_dict = english_dict_set if english_dict_set is not None else set()

    def is_cjk(ch: str) -> bool:
        return bool(cjk_re.match(ch))

    def split_mixed_runs(text: str):
        """Split text into runs of CJK and non-CJK characters."""
        if not text:
            return []
        runs = []
        buf = [text[0]]
        last_is_cjk = is_cjk(text[0])
        for ch in text[1:]:
            cur_is_cjk = is_cjk(ch)
            if cur_is_cjk == last_is_cjk:
                buf.append(ch)
            else:
                runs.append("".join(buf))
                buf = [ch]
                last_is_cjk = cur_is_cjk
        runs.append("".join(buf))
        return runs

    def tokenize(text: str):
        tokens = []
        for run in split_mixed_runs(text):
            if not run.strip():
                continue
            if is_cjk(run[0]):
                if use_jieba and jieba is not None:
                    # Use jieba accurate mode (cut_all=False)
                    tokens.extend([t for t in jieba.cut(run, cut_all=False) if t.strip()])
                else:
                    # Fallback: character-by-character for Chinese
                    tokens.extend([ch for ch in run if ch.strip()])
            else:
                tokens.extend(en_token_re.findall(run))
        return [t for t in tokens if t and not t.isspace()]

    def is_punctuation(tok: str) -> bool:
        """Check if token is punctuation (ASCII or CJK)."""
        if tok in {
            # ASCII punctuation
            ".", ",", "!", "?", ";", ":", "-", "_", "(", ")", "[", "]", "{", "}",
            '"', "'", "`", "~", "@", "#", "$", "%", "^", "&", "*", "+", "=", "|", "\\",
            "/", "<", ">",
            # CJK punctuation
            "，", "。", "！", "？", "；", "：", "、", "（", "）", "《", "》", "“", "”", "‘", "'",
            "【", "】", "「", "」", "『", "』", "－", "—", "…", "·", "～",
        }:
            return True
        # Single non-alphanumeric ASCII chars are likely punctuation
        if len(tok) == 1 and not tok.isalnum() and not is_cjk(tok):
            return True
        return False

    def is_chinese_stopword(tok: str) -> bool:
        """Check for common Chinese stopwords that may not be in the stopwords file."""
        chinese_stopwords = {
            "的", "是", "在", "了", "和", "与", "或", "有", "被", "把", "让", "给",
            "这", "那", "这个", "那个", "这些", "那些", "什么", "怎么", "如何", "为什么",
            "我", "你", "他", "她", "它", "我们", "你们", "他们", "自己", "大家",
            "很", "都", "也", "就", "才", "又", "还", "再", "已经", "正在",
            "能", "会", "可以", "应该", "必须", "需要", "要", "想", "希望",
            "不", "没", "没有", "无", "非", "未", "别", "不要",
            "上", "下", "里", "外", "前", "后", "左", "右", "中", "间", "内",
            "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "百", "千", "万", "亿",
            "个", "只", "条", "件", "种", "些", "次", "回", "遍", "番",
            "着", "过", "起来", "出来", "进来", "回来", "上来", "下来", "进去", "出去",
        }
        return tok in chinese_stopwords

    def is_valid_word(tok: str) -> bool:
        """Check if token is a valid word in either Chinese or English dictionary."""
        # For Chinese words: check if in Chinese dictionary (jieba dict)
        if is_cjk(tok[0]) and len(tok) > 1:
            if chinese_dict and tok in chinese_dict:
                return True
            # If no dict or not in dict, still allow (jieba may have segmented it)
            return True
        
        # For English words: check if in English dictionary
        if ascii_word_re.match(tok):
            tok_lower = tok.lower()
            if english_dict and tok_lower in english_dict:
                return True
            # Allow technical terms, acronyms, and words not in dictionary
            # (they might be domain-specific)
            if len(tok) >= 2:
                return True
        
        # Numbers are always valid
        if tok.replace(".", "").isdigit():
            return True
            
        return True  # Default: allow the token

    def normalize_and_filter(tok: str):
        tok = tok.strip()
        if not tok:
            return None

        if not keep_punctuation and is_punctuation(tok):
            return None

        # Filter out tokens that are too short
        if len(tok) < min_token_len:
            return None

        # Additional rules for ASCII words
        if ascii_word_re.match(tok):
            tok = tok.lower() if lowercase_ascii else tok
            if len(tok) < min_ascii_len:
                return None

        # Check stopwords
        if tok in stopwords:
            return None
        
        # Check Chinese stopwords
        if is_cjk(tok[0]) and is_chinese_stopword(tok):
            return None
        
        # Validate against dictionaries
        if not is_valid_word(tok):
            return None

        return tok

    def tokenize_filtered(text: str):
        for t in tokenize(text):
            t2 = normalize_and_filter(t)
            if t2 is not None:
                yield t2

    # Initialize jieba with user dictionary if provided
    if use_jieba and jieba is not None and user_dict_path:
        try:
            jieba.load_userdict(user_dict_path)
        except Exception:
            pass

    return tokenize_filtered


def _collect_pages_from_navigation(nav: Any) -> List[Dict[str, Any]]:
    pages: List[Dict[str, Any]] = []

    def walk(node: Any):
        if not isinstance(node, dict):
            return
        node_type = node.get("type")
        if node_type == "page":
            pages.append(node)
            return
        children = node.get("children")
        if isinstance(children, list):
            for ch in children:
                walk(ch)

    if isinstance(nav, list):
        for n in nav:
            walk(n)
    elif isinstance(nav, dict):
        walk(nav)

    return pages


def build_lexeme_stats_from_site_data(
    *,
    project_root: str,
    site_data: Dict[str, Any],
    stopwords_file: str,
    ignore_files_list: str,
    user_dict_path: str = "",
    english_dict_path: str = "",
    use_jieba: bool,
    keep_punctuation: bool,
    lowercase_ascii: bool,
    min_ascii_len: int,
    min_token_len: int,
    encoding: str,
    include_exts: Tuple[str, ...],
    max_words_per_page: int,
    # Shannon/entropy selection params
    min_total: int,
    min_df: int,
    max_df_ratio: float,
    min_entropy: float,
    # Reduce JSON size
    top_pages_per_word: int,
    max_words_global: int,
) -> Dict[str, Any]:
    print("[lex] Loading dictionaries...")
    
    # Load stopwords
    stopwords = _load_lines_set(stopwords_file)
    print(f"[lex] stopwords loaded: {len(stopwords)} words")
    
    # Load ignore lists
    ignored_basenames, ignored_relpaths = _load_ignore_lists(ignore_files_list)
    
    # Load Chinese dictionary (jieba format)
    chinese_dict = set()
    if user_dict_path and os.path.isfile(user_dict_path):
        chinese_dict = _load_jieba_dict(user_dict_path)
        print(f"[lex] Chinese dictionary loaded: {len(chinese_dict)} words")
    
    # Load English dictionary
    english_dict = set()
    if english_dict_path and os.path.isfile(english_dict_path):
        english_dict = _load_english_words(english_dict_path)
        print(f"[lex] English dictionary loaded: {len(english_dict)} words")

    tokenize_filtered = _make_tokenizer(
        use_jieba=use_jieba,
        keep_punctuation=keep_punctuation,
        lowercase_ascii=lowercase_ascii,
        min_ascii_len=min_ascii_len,
        min_token_len=min_token_len,
        stopwords=stopwords,
        user_dict_path=user_dict_path,
        english_dict_path=english_dict_path,
        chinese_dict_set=chinese_dict,
        english_dict_set=english_dict,
    )

    pages = _collect_pages_from_navigation(site_data.get("navigation", []))
    print(f"[lex] pages_in_site_data={len(pages)}")

    include_exts_lc = tuple(e.lower() for e in include_exts)

    # Collect word counts across pages for entropy calculation
    word_page_counts: Dict[str, Dict[str, int]] = defaultdict(dict)  # word -> {pageHash: count}
    
    # Track title tokens for boosting
    page_title_tokens: Dict[str, set] = {}  # pageHash -> set of title tokens

    # Store deduplicated title/path data in a page index to reduce site-data.json length
    page_index: Dict[str, Dict[str, str]] = {}

    processed_pages = 0
    skipped_pages = 0

    for p in pages:
        page_hash = str(p.get("hash") or "").strip()
        md_path = str(p.get("mdPath") or "").strip()
        page_title = str(p.get("title") or "").strip()
        page_path = str(p.get("path") or "").strip()

        if not page_hash or not md_path:
            skipped_pages += 1
            continue

        if not md_path.lower().endswith(include_exts_lc):
            skipped_pages += 1
            continue

        md_norm = md_path.replace("\\", "/").lstrip("./")
        if os.path.basename(md_norm) in ignored_basenames:
            skipped_pages += 1
            continue
        if md_norm in ignored_relpaths:
            skipped_pages += 1
            continue

        abs_md = os.path.abspath(os.path.join(project_root, md_path))
        if not os.path.isfile(abs_md):
            print(f"[lex] missing_md_file: {md_path}")
            skipped_pages += 1
            continue

        try:
            with open(abs_md, "r", encoding=encoding, errors="ignore") as f:
                text = f.read()
        except OSError:
            skipped_pages += 1
            continue

        c = Counter(tokenize_filtered(text))

        # Optional size cap (keeps only top-N words per page)
        if max_words_per_page > 0 and len(c) > max_words_per_page:
            c = Counter(dict(c.most_common(max_words_per_page)))

        page_index[page_hash] = {"title": page_title, "path": page_path}
        
        # Extract title tokens for title boost calculation
        title_tokens = set(tokenize_filtered(page_title))
        page_title_tokens[page_hash] = title_tokens

        for w, cnt in c.items():
            word_page_counts[w][page_hash] = int(cnt)

        processed_pages += 1

    print(f"[lex] processed_pages={processed_pages}, skipped_pages={skipped_pages}")
    total_pages = max(1, processed_pages)

    # Pre-calculate IDF values for all words
    # IDF = log(N / df) where N = total pages, df = document frequency
    word_idf: Dict[str, float] = {}
    for w, pc in word_page_counts.items():
        df = len(pc)
        # Use smoothed IDF: log((N + 1) / (df + 1)) + 1
        # This prevents division by zero and provides a minimum IDF of 1
        word_idf[w] = math.log((total_pages + 1) / (df + 1)) + 1

    # Calculate max word count per page for TF normalization
    page_total_words: Dict[str, int] = {}  # pageHash -> total word count
    for w, pc in word_page_counts.items():
        for h, cnt in pc.items():
            page_total_words[h] = page_total_words.get(h, 0) + cnt

    # Entropy calculation + filtering out words that are too common or too rare
    candidates: Dict[str, Any] = {}

    for w, pc in word_page_counts.items():
        df = len(pc)
        total = sum(pc.values())
        if total <= 0:
            continue

        # Filter out rare words
        if total < min_total:
            continue
        if df < min_df:
            continue

        # Filter out words that appear on too many pages (stop words)
        if (df / total_pages) > max_df_ratio:
            continue

        # Shannon entropy (page distribution)
        H = 0.0
        for cnt_i in pc.values():
            p_i = cnt_i / total
            H -= p_i * math.log(p_i, 2)

        if H < min_entropy:
            continue

        idf = word_idf[w]
        
        # Build pages list with TF-IDF weight
        # Weight calculation:
        # - TF: normalized term frequency (cnt / total_words_in_page)
        # - IDF: pre-calculated inverse document frequency
        # - Title boost: 3x weight if word appears in page title
        pages_list = []
        for h, cnt in pc.items():
            # Calculate normalized TF
            page_total = page_total_words.get(h, 1)
            tf = cnt / page_total if page_total > 0 else 0
            
            # TF-IDF score
            tfidf = tf * idf
            
            # Title boost: check if word is in title
            is_in_title = w in page_title_tokens.get(h, set())
            if is_in_title:
                tfidf *= 3.0  # 3x boost for title matches
            
            # Scale score for storage (multiply by 10000 to preserve precision with int)
            scaled_score = int(tfidf * 10000)
            
            pages_list.append({
                "h": h,
                "c": int(cnt),
                "s": scaled_score,  # TF-IDF score (scaled)
                "t": 1 if is_in_title else 0  # title match flag
            })
        
        # Sort by TF-IDF score (descending)
        pages_list.sort(key=lambda x: x.get("s", 0), reverse=True)
        if top_pages_per_word > 0:
            pages_list = pages_list[:top_pages_per_word]

        candidates[w] = {
            "t": int(total),               # total count
            "df": int(df),                 # document frequency
            "dfr": float(df / total_pages),
            "H": float(H),                 # entropy
            "idf": round(idf, 4),          # IDF value for frontend use
            "p": pages_list,               # pages: [{h, c, s, t}]
        }

    # Global trim: select words with highest entropy to further shrink JSON
    words_sorted = sorted(candidates.keys(), key=lambda ww: candidates[ww]["H"], reverse=True)
    if max_words_global > 0:
        words_sorted = words_sorted[:max_words_global]

    by_word = {w: candidates[w] for w in words_sorted}

    print(f"[lex] unique_words_indexed(after_filter+shrink)={len(by_word)}")

    return {
        "version": 4,  # Bump version for new weight format
        "source": {
            "mode": "byWord-with-tfidf-weights",
            "includeExts": list(include_exts_lc),
            "maxWordsPerPage": int(max_words_per_page),
            "totalPages": int(total_pages),
            "filters": {
                "minTokenLen": int(min_token_len),
                "minAsciiLen": int(min_ascii_len),
                "minTotal": int(min_total),
                "minDf": int(min_df),
                "maxDfRatio": float(max_df_ratio),
                "minEntropy": float(min_entropy),
            },
            "shrink": {
                "topPagesPerWord": int(top_pages_per_word),
                "maxWordsGlobal": int(max_words_global),
            },
        },
        "pageIndex": page_index,  # hash -> {title,path}
        "byWord": by_word,        # word -> compact stats with TF-IDF
        "selectedWords": words_sorted,
    }


def _main():
    here = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(here, "..", ".."))  # Go up two levels: search-script/ -> scripts/ -> project_root

    parser = argparse.ArgumentParser(
        description="Compute Shannon-entropy-based byWord lexeme stats and write into public/vmdjson/site-data.json."
    )
    parser.add_argument(
        "--site-data-json",
        default=os.path.join(project_root, "public", "vmdjson", "site-data.json"),
        help="Path to public/vmdjson/site-data.json",
    )
    parser.add_argument("--stopwords", default=os.path.join(here, "stopwords.txt"))
    parser.add_argument("--ignore-files", default=os.path.join(here, "ignore_files.txt"))
    parser.add_argument("--user-dict", default=os.path.join(here, "user_dict.txt"),help="Path to jieba user dictionary for Chinese words")
    parser.add_argument("--english-dict", default=os.path.join(here, "english_words.txt"),help="Path to English words dictionary")
    parser.add_argument("--no-jieba", action="store_true")
    parser.add_argument("--keep-punctuation", action="store_true")
    parser.add_argument("--compress", action="store_true", help="Output minified JSON (no indentation). Default: False")

    # Length limit parameters - lowered defaults to be more permissive
    parser.add_argument("--min-token-len", type=int, default=1, help="Minimum token length. Default: 1")
    parser.add_argument("--min-ascii-len", type=int, default=1, help="Minimum length for ASCII words. Default: 1")

    parser.add_argument("--encoding", default="utf-8")
    parser.add_argument("--exts", default=".md", help="Comma-separated extensions to include (default: .md)")
    parser.add_argument(
        "--max-words-per-page",
        type=int,
        default=0,
        help="Cap words counted per page (0 = no limit). Default: 0 (no limit)",
    )

    # Shannon filter parameters
    parser.add_argument("--min-total", type=int, default=1, help="Discard words with total count below this value. Default: 1")
    parser.add_argument("--min-df", type=int, default=1, help="Discard words that appear in fewer pages than this value. Default: 1")
    parser.add_argument(
        "--max-df-ratio",
        type=float,
        default=1.0,
        help="Discard words appearing in more than this ratio of total pages (e.g. 1.0 means don't discard any). Default: 1.0",
    )
    parser.add_argument(
        "--min-entropy",
        type=float,
        default=0.0,
        help="Minimum Shannon entropy based on page distribution. Default: 0.0 (no entropy filter)",
    )

    # Output size limits
    parser.add_argument(
        "--top-pages-per-word",
        type=int,
        default=0,
        help="Maximum number of top occurrence pages to store per word (0 = no limit). Default: 0 (no limit)",
    )
    parser.add_argument(
        "--max-words-global",
        type=int,
        default=0,
        help="Maximum number of global words to keep (0 = no limit). Default: 0 (no limit)",
    )

    args = parser.parse_args()
    site_data_json_abs = os.path.abspath(args.site_data_json)

    with open(site_data_json_abs, "r", encoding="utf-8") as f:
        site_data = json.load(f)
        if not isinstance(site_data, dict):
            raise ValueError("site-data.json root must be a JSON object")

    exts = tuple(e.strip() for e in str(args.exts).split(",") if e.strip())
    if not exts:
        exts = (".md",)

    stats = build_lexeme_stats_from_site_data(
        project_root=project_root,
        site_data=site_data,
        stopwords_file=args.stopwords,
        ignore_files_list=args.ignore_files,
        user_dict_path=args.user_dict,
        english_dict_path=args.english_dict,
        use_jieba=not args.no_jieba,
        keep_punctuation=bool(args.keep_punctuation),
        lowercase_ascii=True,
        min_ascii_len=int(args.min_ascii_len),
        min_token_len=int(args.min_token_len),
        encoding=str(args.encoding),
        include_exts=exts,
        max_words_per_page=int(args.max_words_per_page),
        min_total=int(args.min_total),
        min_df=int(args.min_df),
        max_df_ratio=float(args.max_df_ratio),
        min_entropy=float(args.min_entropy),
        top_pages_per_word=int(args.top_pages_per_word),
        max_words_global=int(args.max_words_global),
    )

    site_data["lexemeStats"] = stats

    os.makedirs(os.path.dirname(site_data_json_abs) or ".", exist_ok=True)
    with open(site_data_json_abs, "w", encoding="utf-8") as f:
        # Compress if --compress flag is set
        indent = None if args.compress else 2
        separators = (',', ':') if args.compress else (', ', ': ')
        json.dump(site_data, f, ensure_ascii=False, indent=indent, separators=separators)
        f.write("\n")

    print(f"[lex] updated site-data.json with lexemeStats{'(compressed)' if args.compress else '(formatted)'}: {site_data_json_abs}")


if __name__ == "__main__":
    _main()