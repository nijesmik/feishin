import { LuCircleCheck } from 'react-icons/lu';

import styles from './verified-artist-badge.module.css';

interface VerifiedArtistBadgeProps {
    artistId: string | undefined;
}

export const VerifiedArtistBadge = ({ artistId }: VerifiedArtistBadgeProps) => {
    if (!artistId?.endsWith(' - Topic')) return null;
    return <LuCircleCheck className={styles.badge} size={14} />;
};
