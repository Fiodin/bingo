function darkenHex(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;
    const r = Math.max(0, parseInt(result[1], 16) - 40);
    const g = Math.max(0, parseInt(result[2], 16) - 40);
    const b = Math.max(0, parseInt(result[3], 16) - 40);
    return '#' + r.toString(16).padStart(2,'0') + g.toString(16).padStart(2,'0') + b.toString(16).padStart(2,'0');
}

fetch('/api/themes')
    .then(function(res) { return res.json(); })
    .then(function(themes) {
        var grid = document.getElementById('themes-grid');
        grid.innerHTML = '';

        Object.entries(themes).forEach(function(entry) {
            var id = entry[0];
            var theme = entry[1];
            var color = theme.color || '#667eea';
            var darkColor = darkenHex(color);
            var icon = theme.icon || '🎯';

            var card = document.createElement('a');
            card.href = '/' + id;
            card.className = 'theme-card';
            card.style.borderColor = color;
            card.innerHTML =
                '<div class="theme-icon">' + icon + '</div>' +
                '<div class="theme-title">' + theme.title + '</div>' +
                '<div class="theme-description">' + (theme.description || '') + '</div>';

            card.addEventListener('mouseenter', function() {
                card.style.background = 'linear-gradient(135deg, ' + color + ' 0%, ' + darkColor + ' 100%)';
            });
            card.addEventListener('mouseleave', function() {
                card.style.background = '';
            });

            grid.appendChild(card);
        });
    })
    .catch(function() {
        document.getElementById('themes-grid').innerHTML =
            '<div class="error">Themen konnten nicht geladen werden. Bitte Seite neu laden.</div>';
    });

