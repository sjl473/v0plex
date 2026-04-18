"use client"

import React, { ReactNode, useState, useMemo, useRef, useEffect } from 'react';
import {
  Theme,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Pagination,
} from '@carbon/react';
import { useTheme } from '@/components/common/theme-provider';
import { useLanguage } from '@/components/common/language-provider';
import styles from './tablevmd.module.css';

// Table container component with pagination
export function Tablevmd({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const { strings } = useLanguage();
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const tableRef = useRef<HTMLDivElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);

  // Log widths for debugging
  useEffect(() => {
    if (tableRef.current && paginationRef.current) {
      const tableWidth = tableRef.current.getBoundingClientRect().width;
      const paginationWidth = paginationRef.current.getBoundingClientRect().width;
      // console.log('[Tablevmd] Table width:', tableWidth);
      // console.log('[Tablevmd] Pagination width:', paginationWidth);
    }
  }, [children, page]);

  // Extract rows from children
  const rows = useMemo(() => {
    const rowsArray: ReactNode[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === Tablebodyvmd) {
        const bodyProps = child.props as { children: ReactNode };
        React.Children.forEach(bodyProps.children, (row) => {
          if (React.isValidElement(row) && row.type === Tablerowvmd) {
            rowsArray.push(row);
          }
        });
      }
    });
    return rowsArray;
  }, [children]);

  // Extract head from children
  const head = useMemo(() => {
    let headElement: ReactNode = null;
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === Tableheadvmd) {
        headElement = child;
      }
    });
    return headElement;
  }, [children]);

  // Calculate paginated rows
  const totalRows = rows.length;
  const shouldPaginate = totalRows > pageSize;
  const startIndex = (page - 1) * pageSize;
  const paginatedRows = shouldPaginate
    ? rows.slice(startIndex, startIndex + pageSize)
    : rows;

  return (
    <div className={styles.tableContainer}>
      <Theme theme={theme}>
        {/* Table scroll container */}
        <div className={`${styles.tableResponsiveWrapper} table-responsive-wrapper`}>
          <div className={`${styles.tablePaginatedContainer} table-paginated-container`} ref={tableRef}>
            <Table size="xs" stickyHeader={false}>
              {head}
              <TableBody>
                {paginatedRows}
              </TableBody>
            </Table>
          </div>
        </div>
        {/* Pagination outside scroll container - fixed at bottom */}
        {shouldPaginate && (
          <div className={styles.paginationWrapper} ref={paginationRef}>
            <Pagination
              page={page}
              pageSize={pageSize}
              pageSizes={[pageSize]}
              totalItems={totalRows}
              onChange={({ page }: { page: number }) => setPage(page)}
              itemsPerPageText={strings.tablePagination.itemsPerPage}
              pageRangeText={() => ""}
              backwardText={strings.tablePagination.previous}
              forwardText={strings.tablePagination.next}
            />
          </div>
        )}
      </Theme>
    </div>
  );
}

// Table head component
export function Tableheadvmd({ children }: { children: ReactNode }) {
  return (
    <TableHead>
      {children}
    </TableHead>
  );
}

// Table body component
export function Tablebodyvmd({ children }: { children: ReactNode }) {
  return (
    <TableBody>
      {children}
    </TableBody>
  );
}

// Table row component
export function Tablerowvmd({ children }: { children: ReactNode }) {
  return (
    <TableRow>
      {children}
    </TableRow>
  );
}

// Table cell component
interface TablecellvmdProps {
  children: ReactNode;
  header?: string;
  align?: 'left' | 'center' | 'right' | null;
}

export function Tablecellvmd({ children, header }: TablecellvmdProps) {
  const isHeader = header === 'true';

  if (isHeader) {
    return (
      <TableHeader>
        {children}
      </TableHeader>
    );
  }

  return (
    <TableCell>
      {children}
    </TableCell>
  );
}
