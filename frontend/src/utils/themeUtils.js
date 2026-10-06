// Utility function to manage global application theme (Light, Dark, System)

export const applyTheme = (theme) => {
  const selectedTheme = theme || localStorage.getItem('gigsphere_theme') || 'system';
  localStorage.setItem('gigsphere_theme', selectedTheme);

  const root = document.documentElement;
  if (selectedTheme === 'dark') {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
  } else if (selectedTheme === 'light') {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
  } else {
    // System Preference
    root.removeAttribute('data-theme');
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
};

export const initTheme = () => {
  const savedTheme = localStorage.getItem('gigsphere_theme') || 'system';
  applyTheme(savedTheme);

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const current = localStorage.getItem('gigsphere_theme') || 'system';
      if (current === 'system') {
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    });
  }
};
