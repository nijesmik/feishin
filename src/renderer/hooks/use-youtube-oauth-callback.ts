import { nanoid } from 'nanoid/non-secure';
import { useEffect, useRef } from 'react';

import { fetchMe } from '/@/renderer/api/youtube/youtube-controller';
import { useAuthStore, useAuthStoreActions } from '/@/renderer/store';
import { ServerListItemWithCredential } from '/@/shared/types/domain-types';
import { ServerType } from '/@/shared/types/domain-types';
import { toast } from '/@/shared/components/toast/toast';
import { closeAllModals } from '@mantine/modals';

const YOUTUBE_PENDING_KEY = 'youtube_oauth_pending';

export const setYouTubeOAuthPending = (serverUrl: string, serverName: string) => {
    sessionStorage.setItem(
        YOUTUBE_PENDING_KEY,
        JSON.stringify({ serverUrl, serverName }),
    );
};

export const useYouTubeOAuthCallback = () => {
    const { addServer, setCurrentServer } = useAuthStoreActions();
    const hasChecked = useRef(false);

    useEffect(() => {
        if (hasChecked.current) return;
        hasChecked.current = true;

        const pending = sessionStorage.getItem(YOUTUBE_PENDING_KEY);
        if (!pending) return;

        sessionStorage.removeItem(YOUTUBE_PENDING_KEY);

        let serverUrl: string;
        let serverName: string;
        try {
            ({ serverUrl, serverName } = JSON.parse(pending));
        } catch {
            return;
        }

        fetchMe(serverUrl)
            .then((me) => {
                const serverList = useAuthStore.getState().serverList;
                const existing = Object.values(serverList).find(
                    (s) => s.url === serverUrl,
                );

                const serverItem: ServerListItemWithCredential = {
                    credential: 'cookie',
                    id: existing?.id ?? nanoid(),
                    isAdmin: me.is_admin,
                    name: serverName,
                    type: ServerType.YOUTUBE,
                    url: serverUrl,
                    userId: me.id,
                    username: me.display_name,
                };

                addServer(serverItem);
                setCurrentServer(serverItem);
                closeAllModals();
                toast.success({ message: `Connected to ${serverName}` });
            })
            .catch((error: unknown) => {
                console.error('YouTube OAuth callback failed:', error);

                const isNetworkError =
                    error instanceof TypeError && error.message === 'Failed to fetch';
                const message = isNetworkError
                    ? 'Cannot reach server — check your connection'
                    : 'Google login failed — please try again';

                toast.error({ message });
            });
    }, [addServer, setCurrentServer]);
};
