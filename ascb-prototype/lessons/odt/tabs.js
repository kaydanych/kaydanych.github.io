(() => {
  const tabs = [...document.querySelectorAll('.odt-tabs [role=tab]')];
  function select(tab, updateHash = true) {
    const id = tab.getAttribute('aria-controls');
    for (const item of tabs) {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
    }
    // A walkthrough must not keep advancing after its panel is hidden.
    if (id !== 'reconstruction' && document.getElementById('play-story').textContent.includes('Pause')) document.getElementById('play-story').click();
    if (updateHash) history.replaceState(null, '', '#' + id);
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', event => {
      let index;
      if (event.key === 'ArrowRight') index = (i + 1) % tabs.length;
      if (event.key === 'ArrowLeft') index = (i + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') index = 0;
      if (event.key === 'End') index = tabs.length - 1;
      if (index === undefined) return;
      event.preventDefault(); tabs[index].focus(); select(tabs[index]);
    });
  });
  function fromHash() { select(tabs.find(t => '#' + t.getAttribute('aria-controls') === location.hash) || tabs[0], false); }
  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
