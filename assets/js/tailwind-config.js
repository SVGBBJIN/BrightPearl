    tailwind.config = {
      darkMode: 'media',
      theme: {
        extend: {
          colors: {
            cream:    'rgb(var(--cream-rgb) / <alpha-value>)',
            ink:      'rgb(var(--ink-rgb) / <alpha-value>)',
            imperial: 'rgb(var(--imperial-rgb) / <alpha-value>)',
            surface:  'rgb(var(--surface-rgb) / <alpha-value>)',
            indigo:   'rgb(var(--indigo-rgb) / <alpha-value>)',
            gold:     'rgb(var(--gold-rgb) / <alpha-value>)',
          },
          fontFamily: {
            display: ['Cinzel', 'Playfair Display', 'serif'],
            serif:   ['Playfair Display', 'Georgia', 'serif'],
            body:    ['Inter', 'sans-serif'],
          },
        },
      },
    };
