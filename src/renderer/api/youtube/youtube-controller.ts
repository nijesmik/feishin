import {
    InternalControllerEndpoint,
    LibraryItem,
    Playlist,
    ServerType,
    Song,
} from '/@/shared/types/domain-types';

interface YouTubeMeResponse {
    id: string;
    google_user_id: string;
    email: string;
    display_name: string;
    picture_url: string | null;
    is_admin: boolean;
}

interface YouTubeTrack {
    video_id: string;
    title: string;
    channel_title: string;
    duration_sec: number;
    published_at: string;
    thumbnails: Record<string, string | null>;
    album_name: string | null;
}

interface YouTubePlaylistSummary {
    id: string;
    name: string;
    description: string;
    track_count: number;
    cover_url: string | null;
    privacy_status: string;
}

const ytFetch = async (url: string, signal?: AbortSignal): Promise<any> => {
    const res = await fetch(url, {
        credentials: 'include',
        signal,
    });

    if (!res.ok) {
        throw new Error(`YouTube API error: ${res.status}`);
    }

    return res.json();
};

const MAX_PAGES = 200;

interface PaginatedResponse<T> {
    items: T[];
    next_page_token: string | null;
}

const paginatedUrl = (baseUrl: string, pageToken: string): string => {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}pageToken=${pageToken}`;
};

const fetchAllPages = async <T>(
    baseUrl: string,
    signal?: AbortSignal,
): Promise<T[]> => {
    const allItems: T[] = [];
    let pageToken: string | null = null;
    let page = 0;

    do {
        if (signal?.aborted) {
            throw new DOMException('The operation was aborted.', 'AbortError');
        }

        page++;
        if (page > MAX_PAGES) {
            throw new Error(
                `Pagination limit reached (${MAX_PAGES} pages, ${allItems.length} items fetched) for ${baseUrl}`,
            );
        }

        const url = pageToken ? paginatedUrl(baseUrl, pageToken) : baseUrl;
        const data: PaginatedResponse<T> = await ytFetch(url, signal);

        if (!data.items) {
            throw new Error(
                `Missing items in response (page ${page}, ${allItems.length} items fetched so far) for ${baseUrl}`,
            );
        }

        allItems.push(...data.items);
        pageToken = data.next_page_token;
    } while (pageToken);

    return allItems;
};

const fetchUntilFound = async <T>(
    baseUrl: string,
    predicate: (item: T) => boolean,
    signal?: AbortSignal,
): Promise<T | null> => {
    let pageToken: string | null = null;
    let page = 0;

    do {
        if (signal?.aborted) {
            throw new DOMException('The operation was aborted.', 'AbortError');
        }

        page++;
        if (page > MAX_PAGES) {
            throw new Error(
                `Pagination limit reached (${MAX_PAGES} pages) while searching for ${baseUrl}`,
            );
        }

        const url = pageToken ? paginatedUrl(baseUrl, pageToken) : baseUrl;
        const data: PaginatedResponse<T> = await ytFetch(url, signal);

        if (!data.items) {
            throw new Error(
                `Missing items in response (page ${page}) for ${baseUrl}`,
            );
        }

        const found = data.items.find(predicate);
        if (found) return found;

        pageToken = data.next_page_token;
    } while (pageToken);

    return null;
};

export const fetchMe = async (serverUrl: string): Promise<YouTubeMeResponse> => {
    const res = await fetch(`${serverUrl}/me`, { credentials: 'include' });

    if (!res.ok) {
        throw new Error('Not authenticated');
    }

    return res.json();
};

const mapTrackToSong = (track: YouTubeTrack, serverId: string): Song => {
    const thumbUrl =
        track.thumbnails.maxres ||
        track.thumbnails.high ||
        track.thumbnails.medium ||
        track.thumbnails.default ||
        null;

    const artist = cleanArtistName(track.channel_title);

    return {
        _itemType: LibraryItem.SONG,
        _serverId: serverId,
        _serverType: ServerType.YOUTUBE,
        album: track.album_name ?? null,
        albumArtistName: artist,
        albumArtists: [],
        albumId: '',
        artistName: artist,
        artists: [
            {
                id: track.channel_title,
                imageId: null,
                imageUrl: null,
                name: artist,
                userFavorite: false,
                userRating: null,
            },
        ],
        bitDepth: null,
        bitRate: 0,
        bpm: null,
        channels: null,
        comment: null,
        compilation: null,
        container: null,
        createdAt: track.published_at,
        discNumber: 1,
        discSubtitle: null,
        duration: track.duration_sec * 1000,
        explicitStatus: null,
        gain: null,
        genres: [],
        id: track.video_id,
        imageId: thumbUrl,
        imageUrl: null,
        lastPlayedAt: null,
        lyrics: null,
        mbzRecordingId: null,
        mbzTrackId: null,
        name: track.title,
        participants: null,
        path: null,
        peak: null,
        playCount: 0,
        releaseDate: track.published_at,
        releaseYear: track.published_at
            ? new Date(track.published_at).getFullYear()
            : null,
        sampleRate: null,
        size: 0,
        sortName: track.title,
        tags: null,
        trackNumber: 0,
        trackSubtitle: null,
        updatedAt: track.published_at,
        userFavorite: false,
        userRating: null,
    };
};

const mapPlaylistSummary = (pl: YouTubePlaylistSummary, serverId: string): Playlist => {
    return {
        _itemType: LibraryItem.PLAYLIST,
        _serverId: serverId,
        _serverType: ServerType.YOUTUBE,
        description: pl.description || null,
        duration: null,
        genres: [],
        id: pl.id,
        imageId: pl.cover_url || null,
        imageUrl: null,
        name: pl.name,
        owner: null,
        ownerId: null,
        public: pl.privacy_status === 'public',
        size: null,
        songCount: pl.track_count,
    };
};

const cleanArtistName = (name: string): string => {
    return name.replace(/ - Topic$/, '');
};

const notImplemented = (name: string) => {
    return () => {
        throw new Error(`${name} is not implemented for YouTube`);
    };
};

export const YouTubeController: InternalControllerEndpoint = {
    addToPlaylist: notImplemented('addToPlaylist') as any,
    authenticate: async (url, _body) => {
        const me = await fetchMe(url);
        return {
            credential: 'cookie',
            isAdmin: me.is_admin,
            userId: me.id,
            username: me.display_name,
        };
    },
    createFavorite: notImplemented('createFavorite') as any,
    createInternetRadioStation: notImplemented('createInternetRadioStation') as any,
    createPlaylist: notImplemented('createPlaylist') as any,
    deleteFavorite: notImplemented('deleteFavorite') as any,
    deleteInternetRadioStation: notImplemented('deleteInternetRadioStation') as any,
    deletePlaylist: notImplemented('deletePlaylist') as any,
    getAlbumArtistDetail: async (args) => {
        const { apiClientProps, query } = args;
        const server = apiClientProps.server;
        if (!server) throw new Error('No server');

        const data = await ytFetch(
            `${server.url}/artists/${encodeURIComponent(query.id)}`,
            apiClientProps.signal,
        );

        return {
            _itemType: LibraryItem.ALBUM_ARTIST,
            _serverId: server.id,
            _serverType: ServerType.YOUTUBE,
            albumCount: data.albums?.length ?? 0,
            biography: data.description ?? null,
            duration: null,
            genres: [],
            id: data.id,
            imageId: data.image_url ?? null,
            imageUrl: null,
            lastPlayedAt: null,
            mbz: null,
            name: data.name,
            playCount: null,
            similarArtists: null,
            songCount: null,
            userFavorite: false,
            userRating: null,
        };
    },
    getAlbumArtistList: async () => ({ items: [], startIndex: 0, totalRecordCount: 0 }),
    getAlbumArtistListCount: async () => 0,
    getAlbumDetail: notImplemented('getAlbumDetail') as any,
    getAlbumList: async (args) => {
        const { apiClientProps, query } = args;
        const server = apiClientProps.server;
        if (!server) throw new Error('No server');

        const artistId = query.artistIds?.[0];
        if (!artistId) return { items: [], startIndex: 0, totalRecordCount: 0 };

        const data = await ytFetch(
            `${server.url}/artists/${encodeURIComponent(artistId)}`,
            apiClientProps.signal,
        );

        const items = (data.albums || []).map((album: any) => ({
            _itemType: LibraryItem.ALBUM,
            _serverId: server.id,
            _serverType: ServerType.YOUTUBE,
            albumArtistName: data.name,
            albumArtists: [],
            artists: [],
            comment: null,
            createdAt: '',
            duration: null,
            explicitStatus: null,
            genres: [],
            id: album.id,
            imageId: album.cover_url ?? null,
            imageUrl: null,
            isCompilation: null,
            lastPlayedAt: null,
            mbzId: null,
            mbzReleaseGroupId: null,
            name: album.name,
            originalDate: null,
            originalYear: album.year ?? 0,
            participants: null,
            playCount: null,
            recordLabels: [],
            releaseDate: null,
            releaseType: null,
            releaseTypes: [],
            releaseYear: album.year ?? null,
            size: null,
            songCount: null,
            sortName: album.name,
            tags: null,
            updatedAt: '',
            userFavorite: false,
            userRating: null,
            version: null,
        }));

        return {
            items,
            startIndex: 0,
            totalRecordCount: items.length,
        };
    },
    getAlbumListCount: async () => 0,
    getAlbumRadio: async () => [],
    getArtistList: async () => ({ items: [], startIndex: 0, totalRecordCount: 0 }),
    getArtistListCount: async () => 0,
    getArtistRadio: async () => [],
    getDownloadUrl: () => '',
    getFolder: notImplemented('getFolder') as any,
    getGenreList: async () => ({ items: [], startIndex: 0, totalRecordCount: 0 }),
    getImageRequest: () => null,
    getImageUrl: ({ query }) => {
        return query.id || null;
    },
    getInternetRadioStations: async () => [],
    getMusicFolderList: async () => ({ items: [], startIndex: 0, totalRecordCount: 0 }),
    // Backend has no single-playlist endpoint — fetch all and filter client-side
    getPlaylistDetail: async (args) => {
        const { apiClientProps, query } = args;
        const server = apiClientProps.server;
        if (!server) throw new Error('No server');

        const found = await fetchUntilFound<YouTubePlaylistSummary>(
            `${server.url}/me/playlists`,
            (p) => p.id === query.id,
            apiClientProps.signal,
        );
        if (!found) throw new Error('Playlist not found');

        return mapPlaylistSummary(found, server.id);
    },
    getPlaylistList: async (args) => {
        const { apiClientProps } = args;
        const server = apiClientProps.server;
        if (!server) throw new Error('No server');

        const allPlaylists = await fetchAllPages<YouTubePlaylistSummary>(
            `${server.url}/me/playlists`,
            apiClientProps.signal,
        );
        const items = allPlaylists.map((p) => mapPlaylistSummary(p, server.id));

        return {
            items,
            startIndex: 0,
            totalRecordCount: items.length,
        };
    },
    getPlaylistListCount: async (args) => {
        const { apiClientProps } = args;
        const server = apiClientProps.server;
        if (!server) throw new Error('No server');

        const baseUrl = `${server.url}/me/playlists`;
        const signal = apiClientProps.signal;
        let count = 0;
        let pageToken: string | null = null;
        let page = 0;

        do {
            if (signal?.aborted) {
                throw new DOMException('The operation was aborted.', 'AbortError');
            }

            page++;
            if (page > MAX_PAGES) {
                throw new Error(
                    `Pagination limit reached (${MAX_PAGES} pages, ${count} items counted) for ${baseUrl}`,
                );
            }

            const url = pageToken ? paginatedUrl(baseUrl, pageToken) : baseUrl;
            const data: PaginatedResponse<YouTubePlaylistSummary> & { total_count?: number } =
                await ytFetch(url, signal);

            // Use total_count from backend if available (avoids remaining pages)
            if (page === 1 && data.total_count != null) {
                return data.total_count;
            }

            if (!data.items) {
                break;
            }

            count += data.items.length;
            pageToken = data.next_page_token;
        } while (pageToken);

        return count;
    },
    getPlaylistSongList: async (args) => {
        const { apiClientProps, query } = args;
        const server = apiClientProps.server;
        if (!server) throw new Error('No server');

        const allTracks = await fetchAllPages<YouTubeTrack>(
            `${server.url}/playlists/${query.id}/items`,
            apiClientProps.signal,
        );
        const items = allTracks.map((t) => mapTrackToSong(t, server.id));

        return {
            items,
            startIndex: 0,
            totalRecordCount: items.length,
        };
    },
    getPlayQueue: async () => ({
        changed: '',
        changedBy: '',
        currentIndex: 0,
        entry: [],
        positionMs: 0,
        username: '',
    }),
    getRandomSongList: async () => ({ items: [], startIndex: 0, totalRecordCount: 0 }),
    getRoles: async () => [],
    getServerInfo: async (args) => {
        const server = args.apiClientProps.server;
        return {
            features: {},
            id: server?.id,
            version: '1.0.0',
        };
    },
    getSimilarSongs: async () => [],
    getSongDetail: notImplemented('getSongDetail') as any,
    getSongList: async (args) => {
        const { apiClientProps } = args;
        const server = apiClientProps.server;
        if (!server) throw new Error('No server');

        const allTracks = await fetchAllPages<YouTubeTrack>(
            `${server.url}/me/liked-music`,
            apiClientProps.signal,
        );
        const items = allTracks.map((t) => mapTrackToSong(t, server.id));

        return {
            items,
            startIndex: 0,
            totalRecordCount: items.length,
        };
    },
    getSongListCount: async () => 0,
    getStreamUrl: async (args) => {
        const server = args.apiClientProps.server;
        if (!server) throw new Error('No server');
        return `${server.url}/stream/${args.query.id}`;
    },
    getTopSongs: async () => ({ items: [], startIndex: 0, totalRecordCount: 0 }),
    getUserInfo: async (args) => {
        const server = args.apiClientProps.server;
        if (!server) throw new Error('No server');

        const me = await fetchMe(server.url);
        return {
            id: me.id,
            isAdmin: me.is_admin,
            name: me.display_name,
        };
    },
    removeFromPlaylist: notImplemented('removeFromPlaylist') as any,
    replacePlaylist: notImplemented('replacePlaylist') as any,
    savePlayQueue: async () => {},
    scrobble: async () => null,
    search: async (args) => {
        const { apiClientProps, query } = args;
        const server = apiClientProps.server;
        if (!server) throw new Error('No server');

        if (!query.query) {
            return { albumArtists: [], albums: [], songs: [] };
        }

        const data: {
            items: { video_id: string; title: string; channel_title: string; thumbnail_url: string | null }[];
        } = await ytFetch(
            `${server.url}/search?q=${encodeURIComponent(query.query)}&type=video`,
            apiClientProps.signal,
        );

        const songs: Song[] = data.items.map((item) => {
            const artist = cleanArtistName(item.channel_title);
            return {
            _itemType: LibraryItem.SONG,
            _serverId: server.id,
            _serverType: ServerType.YOUTUBE,
            album: null,
            albumArtistName: artist,
            albumArtists: [],
            albumId: '',
            artistName: artist,
            artists: [
                {
                    id: item.channel_title,
                    imageId: null,
                    imageUrl: null,
                    name: artist,
                    userFavorite: false,
                    userRating: null,
                },
            ],
            bitDepth: null,
            bitRate: 0,
            bpm: null,
            channels: null,
            comment: null,
            compilation: null,
            container: null,
            createdAt: '',
            discNumber: 1,
            discSubtitle: null,
            duration: 0,
            explicitStatus: null,
            gain: null,
            genres: [],
            id: item.video_id,
            imageId: item.thumbnail_url,
            imageUrl: null,
            lastPlayedAt: null,
            lyrics: null,
            mbzRecordingId: null,
            mbzTrackId: null,
            name: item.title,
            participants: null,
            path: null,
            peak: null,
            playCount: 0,
            releaseDate: null,
            releaseYear: null,
            sampleRate: null,
            size: 0,
            sortName: item.title,
            tags: null,
            trackNumber: 0,
            trackSubtitle: null,
            updatedAt: '',
            userFavorite: false,
            userRating: null,
        };
        });

        return { albumArtists: [], albums: [], songs };
    },
    setPlaylistSongs: notImplemented('setPlaylistSongs') as any,
    updateInternetRadioStation: notImplemented('updateInternetRadioStation') as any,
    updatePlaylist: notImplemented('updatePlaylist') as any,
};
