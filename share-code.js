const shareButton = document.getElementById('shareCodeBtn');
const roomCodeDisplay = document.getElementById('roomCodeDisplay');

async function shareRoomCode() {
  const roomCode = roomCodeDisplay?.textContent?.trim();
  if (!roomCode || roomCode === '----') return;

  const gameUrl = window.location.href.split('#')[0].split('?')[0];
  const shareText = `Join my Skinners Bar Bingo game! Room code: ${roomCode}\n${gameUrl}`;

  try {
    if (navigator.share) {
      await navigator.share({
        title: 'Skinners Bar Bingo',
        text: shareText,
        url: gameUrl
      });
      return;
    }

    await navigator.clipboard.writeText(shareText);
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = 'Invite copied — paste it into WhatsApp or a text';
      toast.classList.remove('hidden');
      setTimeout(() => toast.classList.add('hidden'), 2600);
    }
  } catch (error) {
    if (error?.name !== 'AbortError') {
      try {
        await navigator.clipboard.writeText(shareText);
      } catch {}
    }
  }
}

shareButton?.addEventListener('click', shareRoomCode);
