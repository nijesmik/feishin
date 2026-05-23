import { useTranslation } from 'react-i18next';

import { setYouTubeOAuthPending } from '/@/renderer/hooks/use-youtube-oauth-callback';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { ModalButton } from '/@/shared/components/modal/model-shared';
import { Stack } from '/@/shared/components/stack/stack';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const SERVER_NAME = 'YouTube Music';

interface GoogleLoginFormProps {
    onCancel: (() => void) | null;
}

export const GoogleLoginForm = ({ onCancel }: GoogleLoginFormProps) => {
    const { t } = useTranslation();

    const handleGoogleLogin = () => {
        const serverUrl = API_URL.replace(/\/$/, '');
        setYouTubeOAuthPending(serverUrl, SERVER_NAME);
        window.location.href = `${serverUrl}/auth/google/login`;
    };

    return (
        <Stack align="center" gap="xl" py="xl">
            <Button
                fullWidth
                onClick={handleGoogleLogin}
                size="lg"
                style={{ maxWidth: '300px' }}
                variant="filled"
            >
                Google로 로그인
            </Button>
            <Group grow justify="flex-end">
                {onCancel && (
                    <ModalButton onClick={onCancel}>{t('common.cancel')}</ModalButton>
                )}
            </Group>
        </Stack>
    );
};
