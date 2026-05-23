import { LuCircleCheck } from 'react-icons/lu';

interface VerifiedArtistBadgeProps {
    artistId: string;
}

export const VerifiedArtistBadge = ({ artistId }: VerifiedArtistBadgeProps) => {
    if (!artistId.endsWith(' - Topic')) return null;
    return <LuCircleCheck size={14} style={{ marginLeft: 2, color: '#1a9fff', flexShrink: 0 }} />;
};
