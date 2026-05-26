import clsx from 'clsx';
import { useCallback, useMemo, useRef } from 'react';
import { generatePath, Link, useNavigate } from 'react-router';

import styles from './album-column.module.css';

import {
    ColumnNullFallback,
    ColumnSkeletonVariable,
    ItemTableListInnerColumn,
    TableColumnContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { AppRoute } from '/@/renderer/router/routes';
import { Text } from '/@/shared/components/text/text';
import { ServerType, Song } from '/@/shared/types/domain-types';
import { resolveAlbumId } from '/@/renderer/api/youtube/youtube-controller';
import { useAuthStore } from '/@/renderer/store/auth.store';

const AlbumColumn = (props: ItemTableListInnerColumn) => {
    const rowItem = props.getRowItem?.(props.rowIndex) ?? (props.data as any[])[props.rowIndex];
    const row: null | string | undefined = rowItem?.[props.columns[props.columnIndex].id];

    const song = rowItem as Song | undefined;
    const albumId = song?.albumId;
    const navigate = useNavigate();
    const resolvingRef = useRef(false);

    const isYouTube = song?._serverType === ServerType.YOUTUBE;
    const hasAlbumName = isYouTube && !!song?.album && !albumId;

    const albumPath = useMemo(() => {
        if (!albumId) return null;
        return generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, { albumId });
    }, [albumId]);

    const handleYouTubeAlbumClick = useCallback(
        async (e: React.MouseEvent) => {
            e.preventDefault();
            if (resolvingRef.current || !song?.album || !song?.albumArtistName) return;

            const server = useAuthStore.getState().currentServer;
            if (!server) return;

            resolvingRef.current = true;
            try {
                const browseId = await resolveAlbumId(
                    server.url,
                    song.albumArtistName,
                    song.album,
                );
                if (browseId) {
                    const path = generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
                        albumId: browseId,
                    });
                    navigate(path);
                }
            } finally {
                resolvingRef.current = false;
            }
        },
        [song?.album, song?.albumArtistName, navigate],
    );

    if (typeof row === 'string') {
        // Non-YouTube server with albumId — standard link
        if (albumId && albumPath && !isYouTube) {
            return (
                <TableColumnContainer {...props}>
                    <div
                        className={clsx(styles.albumContainer, {
                            [styles.compact]: props.size === 'compact',
                            [styles.large]: props.size === 'large',
                        })}
                    >
                        <Text
                            className={styles.albumLink}
                            component={Link}
                            isLink
                            isMuted
                            isNoSelect
                            state={{ item: song }}
                            to={albumPath}
                        >
                            {row}
                        </Text>
                    </div>
                </TableColumnContainer>
            );
        }

        // YouTube server with album name — lazy resolve on click
        if (hasAlbumName) {
            return (
                <TableColumnContainer {...props}>
                    <div
                        className={clsx(styles.albumContainer, {
                            [styles.compact]: props.size === 'compact',
                            [styles.large]: props.size === 'large',
                        })}
                    >
                        <Text
                            className={styles.albumLink}
                            isLink
                            isMuted
                            isNoSelect
                            onClick={handleYouTubeAlbumClick}
                            role="link"
                            style={{ cursor: 'pointer' }}
                        >
                            {row}
                        </Text>
                    </div>
                </TableColumnContainer>
            );
        }

        // YouTube with albumId (from artist page navigation) — standard link
        if (albumId && albumPath) {
            return (
                <TableColumnContainer {...props}>
                    <div
                        className={clsx(styles.albumContainer, {
                            [styles.compact]: props.size === 'compact',
                            [styles.large]: props.size === 'large',
                        })}
                    >
                        <Text
                            className={styles.albumLink}
                            component={Link}
                            isLink
                            isMuted
                            isNoSelect
                            state={{ item: song }}
                            to={albumPath}
                        >
                            {row}
                        </Text>
                    </div>
                </TableColumnContainer>
            );
        }

        // No album link available — plain text
        return (
            <TableColumnContainer {...props}>
                <Text
                    className={clsx(styles.albumContainer, {
                        [styles.compact]: props.size === 'compact',
                        [styles.large]: props.size === 'large',
                    })}
                    isMuted
                    isNoSelect
                >
                    {row}
                </Text>
            </TableColumnContainer>
        );
    }

    if (row === null) {
        return <ColumnNullFallback {...props} />;
    }

    return <ColumnSkeletonVariable {...props} />;
};

export { AlbumColumn };
