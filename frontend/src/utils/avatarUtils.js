export const getCleanAvatar = (avatarUrl, name = 'User') => {
  if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim() !== '' && !avatarUrl.includes('pravatar.cc')) {
    return avatarUrl;
  }
  const cleanName = (name && typeof name === 'string' ? name.trim() : 'User').toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=1a73e8&color=ffffff&bold=true&uppercase=true`;
};
