import { nanoid } from 'nanoid/non-secure';
import { useEffect, useRef } from 'react';

import { fetchMe } from '/@/renderer/api/youtube/youtube-controller';
import { useAuthStoreActions } from '/@/renderer/store';
import { ServerListItemWithCredential } from '/@/shared/types/domain-types';
import { ServerType } from '/@/shared/types/types';

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

        const { serverUrl, serverName } = JSON.parse(pending);

        fetchMe(serverUrl)
            .then((me) => {
                const serverItem: ServerListItemWithCredential = {
                    credential: 'cookie',
                    id: nanoid(),
                    isAdmin: me.is_admin,
                    name: serverName,
                    type: ServerType.YOUTUBE,
                    url: serverUrl,
                    userId: me.id,
                    username: me.display_name,
                };

                addServer(serverItem);
                setCurrentServer(serverItem);
            })
            .catch(() => {
                // OAuth not completed or cookie not set — ignore
            });
    }, [addServer, setCurrentServer]);
};
