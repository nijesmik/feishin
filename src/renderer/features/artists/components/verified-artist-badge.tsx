import { LuCircleCheck } from 'react-icons/lu';

const badgeStyle = { marginLeft: 2, color: '#1a9fff' } as const;

interface VerifiedArtistBadgeProps {
    artistId: string | undefined;
}

export const VerifiedArtistBadge = ({ artistId }: VerifiedArtistBadgeProps) => {
    if (!artistId?.endsWith(' - Topic')) return null;
    return <LuCircleCheck size={14} style={badgeStyle} />;
};
