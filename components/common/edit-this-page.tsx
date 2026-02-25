import React from 'react';
import styles from './edit-this-page.module.css';
import Link from '@/components/common/link';

interface EditThisPageProps {
    url: string;
}

const EditThisPage: React.FC<EditThisPageProps> = ({url}) => {
    return (<div className={styles.editThisPageLink}>
        <Link href={url}>
            Edit Page on Github / Gitlab ↵
        </Link>
    </div>);
};

export default EditThisPage;