import React from 'react';
import styles from './edit-this-page.module.css';
import Link from '@/components/common/link';
import { useLanguage } from './language-provider';
import { EDIT_THIS_PAGE_URL } from '@/config/site.config';

interface EditThisPageProps {
    url?: string;
}

const EditThisPage: React.FC<EditThisPageProps> = () => {
    const { strings } = useLanguage();
    
    return (<div className={styles.editThisPageLink}>
        <Link href={EDIT_THIS_PAGE_URL}>
            {strings.editThisPage.label}
        </Link>
    </div>);
};

export default EditThisPage;