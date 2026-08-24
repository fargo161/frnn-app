export const PLAYER_SHELL_ROUTE = '/player';

export function ownerProfileView({ profile, player }) {
  return {
    displayName: profile?.display_name || '',
    avatarUrl: null,
    accessCode: player.accessCode,
    quest: {
      completed: Math.max(0, Math.min(4, Number(player.videoAnswerCount || 0))),
      total: 4,
      finalComplete: Boolean(player.finalReflection?.accepted)
    }
  };
}
