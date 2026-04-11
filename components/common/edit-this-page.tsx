import React from 'react';
import styles from './edit-this-page.module.css';
import Link from '@/components/common/link';
import { useLanguage } from './language-provider';

interface EditThisPageProps {
    url: string;
}

const EditThisPage: React.FC<EditThisPageProps> = ({url}) => {
    const { strings } = useLanguage();
    
    return (<div className={styles.editThisPageLink}>
        <Link href={url}>
            {strings.editThisPage.label}
        </Link>
    </div>);
};

export default EditThisPage;