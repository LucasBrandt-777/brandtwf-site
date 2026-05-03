// ── Wait for GSAP to load, then run everything ──
window.addEventListener('load', function() {

  // If GSAP didn't load, fallback to simple visibility
  if (typeof gsap === 'undefined') {
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('nav').classList.add('ready');
    document.querySelectorAll('.reveal,.hero-logo,.hero-pill,.hero-title,.hero-sub,.hero-btns,.hero-scroll').forEach(function(el){
      el.style.opacity='1'; el.style.transform='none';
    });
    document.getElementById('heroBgImg').style.opacity='0.85';
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── LOADER sequence ──
  var loaderTl = gsap.timeline({
    onComplete: function() {
      // Hide loader, reveal site
      gsap.to('#loader', {
        opacity: 0, duration: .7, ease: 'power2.in',
        onComplete: function() {
          document.getElementById('loader').classList.add('hidden');
          initHero();
        }
      });
    }
  });

  loaderTl
    .to('#loader-logo',  { opacity: 1, scale: 1, duration: 1.1, ease: 'power3.out' })
    .to('#loader-brand', { opacity: 1, duration: .7 }, '-=0.5')
    .to('#loader-line',  { width: 200, duration: 1, ease: 'power2.inOut' }, '-=0.4')
    .to('#loader-text',  { opacity: 1, duration: .6 }, '-=0.3')
    .to({}, { duration: .6 }); // pause

  // ── HERO entrance ──
  function initHero() {
    document.getElementById('nav').classList.add('ready');

    if (prefersReduced) {
      // No animation — just show everything
      ['heroLogo','heroPill','heroTitle','heroSub','heroBtns','heroScroll'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) { el.style.opacity = '1'; el.style.transform = 'none'; }
      });
      document.getElementById('heroBgImg').style.opacity = '0.85';
      initScrollAnimations();
      return;
    }

    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Logo is the star — it enters first, large, prominent
    tl
      .fromTo('#heroBgImg',
        { opacity: 0, scale: 1.08 },
        { opacity: 0.82, scale: 1, duration: 2.2, ease: 'power2.out' }, 0
      )
      .fromTo('#heroLogo',
        { opacity: 0, scale: .88, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 1.4, ease: 'power3.out' }, 0.2
      )
      // Gold ring expands from logo
      .fromTo('#heroRing',
        { borderColor: 'rgba(201,168,76,0.6)', scale: .7 },
        { borderColor: 'rgba(201,168,76,0)', scale: 1.4, duration: 1.8, ease: 'power2.out' }, 0.4
      )
      .fromTo('#heroPill',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: .9 }, 1.2
      )
      .fromTo('#heroTitle',
        { opacity: 0, y: 32, clipPath: 'inset(0 0 20% 0)' },
        { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: 1.1 }, 1.6
      )
      .fromTo('#heroSub',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: .9 }, 2.1
      )
      .fromTo('#heroBtns',
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: .8 }, 2.5
      );

    initScrollAnimations();
  }

  function initScrollAnimations() {
    // ── Navbar ──
    var nav = document.getElementById('nav');
    window.addEventListener('scroll', function() {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });

    // ── Hero parallax ──
    gsap.to('.hero-bg img', {
      yPercent: 25,
      ease: 'none',
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });

    // ── Generic reveals ──
    gsap.utils.toArray('.reveal').forEach(function(el) {
      gsap.fromTo(el,
        { opacity: 0, y: 45 },
        {
          opacity: 1, y: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' }
        }
      );
    });

    // ── Stagger groups ──
    gsap.utils.toArray('.stagger-group').forEach(function(group) {
      var items = group.querySelectorAll('.stagger-item');
      gsap.fromTo(items,
        { opacity: 0, y: 55 },
        {
          opacity: 1, y: 0, duration: .9, stagger: .1, ease: 'power3.out',
          scrollTrigger: { trigger: group, start: 'top 80%' }
        }
      );
    });

    // ── Why section image parallax ──
    gsap.utils.toArray('.parallax-img').forEach(function(img) {
      gsap.fromTo(img,
        { yPercent: -8 },
        {
          yPercent: 8, ease: 'none',
          scrollTrigger: {
            trigger: img.closest('section'),
            start: 'top bottom', end: 'bottom top', scrub: 1.5
          }
        }
      );
    });

    // ── Stat counters ──
    document.querySelectorAll('.count-up').forEach(function(el) {
      var target = parseFloat(el.dataset.target);
      var suffix = el.dataset.suffix || '';
      var obj = { val: 0 };
      gsap.to(obj, {
        val: target, duration: 2.2, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
        onUpdate: function() { el.textContent = Math.round(obj.val) + suffix; }
      });
    });

    // ── Magnetic buttons ──
    document.querySelectorAll('.magnetic').forEach(function(el) {
      var strength = parseFloat(el.dataset.strength) || 0.35;
      el.addEventListener('mousemove', function(e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * strength;
        var dy = (e.clientY - (r.top + r.height / 2)) * strength;
        gsap.to(el, { x: dx, y: dy, duration: .4, ease: 'power2.out' });
      });
      el.addEventListener('mouseleave', function() {
        gsap.to(el, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1, 0.4)' });
      });
    });

    // ── Refresh after images load ──
    ScrollTrigger.refresh();
  }

  // ── MOBILE NAV ──
  document.getElementById('hbtn').addEventListener('click', function() {
    document.getElementById('mobNav').classList.add('open');
  });
  document.getElementById('mobClose').addEventListener('click', function() {
    document.getElementById('mobNav').classList.remove('open');
  });

  // ── FORM — Netlify Forms ──
  document.getElementById('qform').addEventListener('submit', function(e) {
    e.preventDefault();
    var form = this;
    var btn = form.querySelector('.fsub');
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Sending...';

    var data = new FormData(form);

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(data).toString()
    })
    .then(function() {
      form.style.display = 'none';
      document.getElementById('fok').classList.add('show');
    })
    .catch(function() {
      btn.disabled = false;
      btn.querySelector('span').textContent = 'Send My Request →';
      alert('Error sending. Please call (689) 250-1209 or email brandtwoodfinishing@gmail.com');
    });
  });


  // ── LIGHTBOX ──
  var BASE = 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main';

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  var PORTFOLIO = {
    millwork: {
      title: 'Custom <em>Millwork</em>',
      slides: shuffle([
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Escadas1.webp', caption: 'Custom staircase with black steel balusters and white painted stringers — residential millwork by Brandt Wood Finishing, Winter Garden FL' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Escadas2.webp', caption: 'Traditional wood staircase with white turned balusters and carpeted treads — custom millwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Escadas3.webp', caption: 'Exterior hardwood deck stairs with rich mahogany finish — custom outdoor woodwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Escadas4.webp', caption: 'Grand two-story staircase with wood handrail and wrought iron balusters — luxury residential millwork by Brandt Wood Finishing, Orlando FL' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Escadas5.webp', caption: 'Custom dark wood staircase with white balusters — staircase remodel by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Escadas6.webp', caption: 'Modern dark hardwood staircase with gray painted railing and iron balusters — custom millwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Escadas7.webp', caption: 'Floating dark oak staircase with glass railing and custom wall paneling — contemporary millwork by Brandt Wood Finishing, Winter Garden FL' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Escadas8.webp', caption: 'Staircase renovation before and after — curved wood stair replaced with modern millwork by Brandt Wood Finishing, Orlando FL' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Lareira1.webp', caption: 'Custom white painted wood fireplace mantel with brick surround — architectural millwork by Brandt Wood Finishing, Winter Garden FL' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Lareira2.webp', caption: 'Reclaimed dark wood fireplace mantel shelf over natural stone surround — custom woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Lareira3.webp', caption: 'Floor-to-ceiling stone fireplace with custom walnut wall paneling and built-in shelving — luxury millwork by Brandt Wood Finishing, Orlando FL' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork1.webp', caption: 'Custom oak and white lacquer credenza with glass top — bespoke millwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork2.webp', caption: 'Floor-to-ceiling walnut wood wall paneling in luxury bedroom — architectural millwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork3.webp', caption: 'Custom laundry room cabinetry in greige with brass hardware — built-in millwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork4.webp', caption: 'Custom wood slat wall paneling with integrated LED lighting — architectural millwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork5.webp', caption: 'Custom built-in black bookcase with LED shelving and wood slat accent wall — home office millwork by Brandt Wood Finishing, Winter Garden FL' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork6.webp', caption: 'Custom wood slat entertainment wall with diamond wine rack and wet bar — luxury millwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork7.webp', caption: 'Custom dark navy wet bar with black sliding barn door and marble countertop — architectural millwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork8.webp', caption: 'Full room custom wood slat wall paneling with integrated lighting — luxury residential millwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork9.webp', caption: 'Luxury living room with custom walnut wood slat walls and floating TV unit — architectural millwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork10.webp', caption: 'Custom black built-in cabinet with wood slat accent wall in home gym — residential millwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork11.webp', caption: 'Custom oak built-in bar cabinet with sunburst carved door panel and backlit onyx stone — signature millwork by Brandt Wood Finishing, Winter Garden FL' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork12.webp', caption: 'Floor-to-ceiling custom wood slat wall with backlit onyx stone columns — luxury architectural millwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork13.webp', caption: 'Custom wood wall paneling with marble inset and white lacquer sideboard — architectural millwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork14.webp', caption: 'Custom walnut bedside table with glass top and leather drawer fronts — bespoke bedroom millwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork15.webp', caption: 'Custom oak entertainment wall with slat paneling and stone fireplace surround — luxury millwork by Brandt Wood Finishing, Winter Garden FL' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork16.webp', caption: 'Custom circular wood porthole feature wall with floating shelves and LED slat paneling — bespoke millwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork17.webp', caption: 'Custom oak and white lacquer credenza with glass top — bespoke millwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork18.webp', caption: 'Floor-to-ceiling walnut wood wall paneling in luxury bedroom — architectural millwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork19.webp', caption: 'Custom laundry room cabinetry in greige with brass hardware — built-in millwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork20.webp', caption: 'Custom wood slat wall paneling with integrated LED lighting — architectural millwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork21.webp', caption: 'Custom built-in black bookcase with LED shelving and wood slat accent wall — home office millwork by Brandt Wood Finishing, Winter Garden FL' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork22.webp', caption: 'Custom wood slat entertainment wall with diamond wine rack and wet bar — luxury millwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork23.webp', caption: 'Custom dark navy wet bar with black sliding barn door and marble countertop — architectural millwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork24.webp', caption: 'Full room custom wood slat wall paneling with integrated lighting — luxury residential millwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork25.webp', caption: 'Luxury living room with custom walnut wood slat walls and floating TV unit — architectural millwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork26.webp', caption: 'Custom black built-in cabinet with wood slat accent wall in home gym — residential millwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork27.webp', caption: 'Custom oak built-in bar cabinet with sunburst carved door panel and backlit onyx stone — signature millwork by Brandt Wood Finishing, Winter Garden FL' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork28.webp', caption: 'Floor-to-ceiling custom wood slat wall with backlit onyx stone columns — luxury architectural millwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork29.webp', caption: 'Custom wood wall paneling with marble inset and white lacquer sideboard — architectural millwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork30.webp', caption: 'Custom walnut bedside table with glass top and leather drawer fronts — bespoke bedroom millwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/MillWork31.webp', caption: 'Custom oak entertainment wall with slat paneling and stone fireplace surround — luxury millwork by Brandt Wood Finishing, Winter Garden FL' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/camas1.webp', caption: 'Custom built-in bed frame and bedroom millwork — luxury residential woodwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/camas2.webp', caption: 'Custom built-in bed frame and bedroom millwork — luxury residential woodwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/camas3.webp', caption: 'Custom built-in bed frame and bedroom millwork — luxury residential woodwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/camas4.webp', caption: 'Custom built-in bed frame and bedroom millwork — luxury residential woodwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/camas5.webp', caption: 'Custom built-in bed frame and bedroom millwork — luxury residential woodwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Portas1.webp', caption: 'Custom dark walnut stained interior doors with arched panels — door millwork by Brandt Wood Finishing, Winter Garden FL' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Portas2.webp', caption: 'Custom mahogany double entry door with circular carved design and stained glass inserts — luxury door millwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Portas3.webp', caption: 'Custom dark wood double entry door with hand-carved floral detail — architectural door millwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Portas4.webp', caption: 'Custom matte black double interior door with raised panel design — contemporary door millwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Portas5.webp', caption: 'Custom mahogany six-panel front door with decorative glass sidelights — residential door millwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Portas6.webp', caption: 'Custom dark mahogany double entry door with circular frosted glass — luxury door millwork by Brandt Wood Finishing, Winter Garden FL' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Portas7.webp', caption: 'Custom dark wood double French door with full glass panels — exterior door millwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Portas8.webp', caption: 'Custom white six-panel double front door with black hardware — residential door installation by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Portas9.webp', caption: 'Custom black six-panel exterior front door with brass hardware on brick facade — door refinishing by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Portas10.webp', caption: 'Custom mahogany raised-panel garage doors on Mediterranean-style Florida home — exterior wood millwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/WallUnit1.webp', caption: 'Custom dark gray display cabinet with glass doors and brass hardware — built-in wall unit by Brandt Wood Finishing, Winter Garden FL' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/WallUnit2.webp', caption: 'Custom floor-to-ceiling black and walnut entertainment wall unit with LED shelving — luxury built-in millwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/WallUnit3.webp', caption: 'Custom matte black built-in entertainment center with electric fireplace and LED backlit shelves — residential millwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/WallUnit6.webp', caption: 'Custom black and oak wall unit with integrated TV niche and LED open shelving — built-in millwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/WallUnit7.webp', caption: 'Custom walnut floor-to-ceiling built-in bookcase with black floating shelves — architectural millwork by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/WallUnit8.webp', caption: 'Custom light oak TV wall panel with integrated LED strip lighting and floating shelves — contemporary built-in millwork by Brandt Wood Finishing, Winter Garden FL' }
      ])
    },
    cabinetry: {
      title: 'Custom Cabinetry <em>&amp; Built-ins</em>',
      slides: shuffle([
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Banheiros1.webp', caption: 'Custom bathroom vanity with marble countertop and integrated lighting — built-in cabinetry by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Banheiros2.webp', caption: 'Luxury master bathroom vanity with double sinks and custom wood cabinetry — Brandt Wood Finishing, Winter Garden FL' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Banheiros3.webp', caption: 'Custom bathroom built-ins with frameless cabinets and brushed gold hardware — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Banheiros4.webp', caption: 'Floor-to-ceiling bathroom storage cabinet with integrated mirror — custom cabinetry by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Banheiros5.webp', caption: 'Custom floating bathroom vanity with quartz top and wood grain finish — Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Banheiros6.webp', caption: 'Spa-style bathroom with custom wood cabinetry and stone countertop — Brandt Wood Finishing, Orlando FL' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Banheiros7.webp', caption: 'Custom his-and-hers bathroom vanity with soft-close drawers — luxury cabinetry by Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Banheiros8.webp', caption: 'Bathroom niche and built-in shelving with custom wood detailing — Brandt Wood Finishing, Winter Garden FL' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Closet1.webp', caption: 'Custom walk-in closet with island and floor-to-ceiling built-ins — luxury cabinetry by Brandt Wood Finishing, Winter Garden FL' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Closet2.webp', caption: 'Custom his-and-hers walk-in closet with LED lighting and velvet-lined drawers — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Closet3.webp', caption: 'Luxury walk-in closet with custom wood shelving and integrated mirror — Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Closet4.webp', caption: 'Custom closet built-ins with glass-front display cabinets — Brandt Wood Finishing, Orlando FL' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Cozinhas1.webp', caption: 'Custom kitchen cabinetry with premium hardware and finishes — Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Cozinhas2.webp', caption: 'Custom kitchen cabinetry with premium hardware and finishes — Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Cozinhas3.webp', caption: 'Custom kitchen cabinetry with premium hardware and finishes — Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Cozinhas4.webp', caption: 'Custom kitchen cabinetry with premium hardware and finishes — Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Cozinhas5.webp', caption: 'Custom kitchen cabinetry with premium hardware and finishes — Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Cozinhas6.webp', caption: 'Custom kitchen cabinetry with premium hardware and finishes — Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Cozinhas7.webp', caption: 'Custom kitchen cabinetry with premium hardware and finishes — Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Cozinhas8.webp', caption: 'Custom kitchen cabinetry with premium hardware and finishes — Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Cozinhas9.webp', caption: 'Custom kitchen cabinetry with premium hardware and finishes — Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Cozinhas10.webp', caption: 'Custom kitchen cabinetry with premium hardware and finishes — Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Cozinhas11.webp', caption: 'Custom kitchen cabinetry with premium hardware and finishes — Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Cozinhas12.webp', caption: 'Custom kitchen cabinetry with premium hardware and finishes — Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Cozinhas13.webp', caption: 'Custom kitchen cabinetry with premium hardware and finishes — Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Cozinhas14.webp', caption: 'Custom kitchen cabinetry with premium hardware and finishes — Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Cozinhas15.webp', caption: 'Custom kitchen cabinetry with premium hardware and finishes — Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Cozinhas16.webp', caption: 'Custom kitchen cabinetry with premium hardware and finishes — Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Cozinhas17.webp', caption: 'Custom kitchen cabinetry with premium hardware and finishes — Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Cozinhas18.webp', caption: 'Custom kitchen cabinetry with premium hardware and finishes — Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Cozinhas19.webp', caption: 'Custom kitchen cabinetry with premium hardware and finishes — Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Cozinhas20.webp', caption: 'Custom kitchen cabinetry with premium hardware and finishes — Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Cozinhas21.webp', caption: 'Custom kitchen cabinetry with premium hardware and finishes — Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Cozinhas22.webp', caption: 'Custom kitchen cabinetry with premium hardware and finishes — Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Cozinhas23.webp', caption: 'Custom kitchen cabinetry with premium hardware and finishes — Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Cozinhas24.webp', caption: 'Custom kitchen cabinetry with premium hardware and finishes — Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Cozinhas25.webp', caption: 'Custom kitchen cabinetry with premium hardware and finishes — Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Cozinhas26.webp', caption: 'Custom kitchen cabinetry with premium hardware and finishes — Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Cozinhas27.webp', caption: 'Custom kitchen cabinetry with premium hardware and finishes — Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Cozinhas28.webp', caption: 'Custom kitchen cabinetry with premium hardware and finishes — Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Cozinhas29.webp', caption: 'Custom kitchen cabinetry with premium hardware and finishes — Brandt Wood Finishing, Central Florida' }
      ])
    },
    restoration: {
      title: 'Antique Furniture <em>Restoration</em>',
      slides: shuffle([
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture1.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture2.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture3.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture4.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture5.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture6.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture7.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture8.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture9.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture10.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture11.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture12.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture13.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture14.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture15.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture16.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture17.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture18.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture19.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture20.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture21.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture22.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture23.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture24.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture25.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture26.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture27.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture28.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture29.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture30.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture31.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture32.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture33.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture34.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture35.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture36.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture37.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture38.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture39.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture40.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture41.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture42.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture43.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture44.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture45.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture46.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture47.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture48.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture49.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture50.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture51.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture52.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture53.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture54.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture55.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture56.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture57.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture58.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture59.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture60.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture61.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture62.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture63.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture64.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture65.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture66.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture67.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture68.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture69.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture70.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture71.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture72.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture73.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture74.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture75.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture76.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture77.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture78.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/Furniture79.webp', caption: 'Antique furniture restoration and refinishing — expert woodwork by Brandt Wood Finishing, Central Florida' }
      ])
    },
    upholstery: {
      title: 'Fine <em>Upholstery</em>',
      slides: shuffle([
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/FineUpholstery1.webp', caption: 'Custom fine upholstery with premium fabrics — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/FineUpholstery2.webp', caption: 'Custom fine upholstery with premium fabrics — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/FineUpholstery3.webp', caption: 'Custom fine upholstery with premium fabrics — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/FineUpholstery4.webp', caption: 'Custom fine upholstery with premium fabrics — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/FineUpholstery5.webp', caption: 'Custom fine upholstery with premium fabrics — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/FineUpholstery6.webp', caption: 'Custom fine upholstery with premium fabrics — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/FineUpholstery7.webp', caption: 'Custom fine upholstery with premium fabrics — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/FineUpholstery8.webp', caption: 'Custom fine upholstery with premium fabrics — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/FineUpholstery9.webp', caption: 'Custom fine upholstery with premium fabrics — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/FineUpholstery10.webp', caption: 'Custom fine upholstery with premium fabrics — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/FineUpholstery11.webp', caption: 'Custom fine upholstery with premium fabrics — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/FineUpholstery12.webp', caption: 'Custom fine upholstery with premium fabrics — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/FineUpholstery13.webp', caption: 'Custom fine upholstery with premium fabrics — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/FineUpholstery14.webp', caption: 'Custom fine upholstery with premium fabrics — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/FineUpholstery15.webp', caption: 'Custom fine upholstery with premium fabrics — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/FineUpholstery16.webp', caption: 'Custom fine upholstery with premium fabrics — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/FineUpholstery17.webp', caption: 'Custom fine upholstery with premium fabrics — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/FineUpholstery18.webp', caption: 'Custom fine upholstery with premium fabrics — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/FineUpholstery19.webp', caption: 'Custom fine upholstery with premium fabrics — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/FineUpholstery20.webp', caption: 'Custom fine upholstery with premium fabrics — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/FineUpholstery21.webp', caption: 'Custom fine upholstery with premium fabrics — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/FineUpholstery22.webp', caption: 'Custom fine upholstery with premium fabrics — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/FineUpholstery23.webp', caption: 'Custom fine upholstery with premium fabrics — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/FineUpholstery24.webp', caption: 'Custom fine upholstery with premium fabrics — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/FineUpholstery25.webp', caption: 'Custom fine upholstery with premium fabrics — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/FineUpholstery26.webp', caption: 'Custom fine upholstery with premium fabrics — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/FineUpholstery27.webp', caption: 'Custom fine upholstery with premium fabrics — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/FineUpholstery28.webp', caption: 'Custom fine upholstery with premium fabrics — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/FineUpholstery29.webp', caption: 'Custom fine upholstery with premium fabrics — Brandt Wood Finishing, Florida' },
        { src: 'https://raw.githubusercontent.com/LucasBrandt-777/brandtwf-site/main/FineUpholstery30.webp', caption: 'Custom fine upholstery with premium fabrics — Brandt Wood Finishing, Florida' }
      ])
    }
  };

  // ── POPULATE OPENING GRID with random real photos ──
  function populateGrid() {
    var catLabels = {
      millwork:    'Custom Millwork',
      cabinetry:   'Custom Cabinetry',
      restoration: 'Antique Restoration',
      upholstery:  'Fine Upholstery'
    };

    // Build flat pool tagging each slide with its category
    var pool = [];
    Object.keys(PORTFOLIO).forEach(function(cat) {
      PORTFOLIO[cat].slides.forEach(function(slide) {
        pool.push({ src: slide.src, caption: slide.caption, category: cat });
      });
    });

    // Shuffle and pick 5
    shuffle(pool);
    var picks = pool.slice(0, 5);

    // Inject into grid items
    var items = document.querySelectorAll('#pfGrid .pf-item');
    picks.forEach(function(pick, i) {
      if (!items[i]) return;
      var img   = items[i].querySelector('img');
      var label = items[i].querySelector('.pf-label');
      var sub   = items[i].querySelector('.pf-sub');

      // Short label: text before the em dash in the caption
      var shortLabel = (pick.caption.split(' \u2014 ')[0] || pick.caption);
      if (shortLabel.length > 52) shortLabel = shortLabel.substring(0, 49) + '\u2026';

      img.src = pick.src;
      img.alt = pick.caption;
      img.removeAttribute('crossorigin');
      img.removeAttribute('referrerpolicy');
      if (label) label.textContent = shortLabel;
      if (sub)   sub.textContent   = catLabels[pick.category] + ' \u00B7 Brandt Wood Finishing';
    });
  }
  populateGrid();

  var lbState = { category: null, current: 0, slides: [] };

  function openLightbox(category) {
    var data = PORTFOLIO[category];
    if (!data) return;

    lbState.category    = category;
    lbState.current     = 0;
    lbState.slides      = data.slides;
    lbState.scrollY     = window.scrollY;

    // Set title
    document.getElementById('lbTitle').innerHTML = data.title;

    // Build slides
    var track = document.getElementById('lbTrack');
    track.innerHTML = '';
    data.slides.forEach(function(slide) {
      var div = document.createElement('div');
      div.className = 'lb-slide';
      var img = document.createElement('img');
        img.src = slide.src;
        img.alt = slide.caption;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.style.cssText = 'max-width:100%;max-height:68vh;object-fit:cover;display:block;border:1px solid rgba(201,168,76,0.1);';
        div.appendChild(img);
      track.appendChild(div);
    });

    updateLightbox();

    var lb = document.getElementById('lb');
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    document.getElementById('lb').classList.remove('open');
    document.body.style.overflow = '';
    if (lbState.scrollY !== undefined) {
      window.scrollTo({ top: lbState.scrollY, behavior: 'instant' });
    }
  }
  window.closeLightbox = closeLightbox;
  window.openLightbox  = openLightbox;

  function updateLightbox() {
    var slides = lbState.slides;
    var cur    = lbState.current;

    // Move track
    document.getElementById('lbTrack').style.transform = 'translateX(-' + (cur * 100) + '%)';

    // Counter
    document.getElementById('lbCurrent').textContent = cur + 1;
    document.getElementById('lbTotal').textContent   = slides.length;

    // Caption
    document.getElementById('lbCaption').textContent = slides[cur].caption;

    // Nav buttons
    document.getElementById('lbPrev').disabled = cur === 0;
    document.getElementById('lbNext').disabled = cur === slides.length - 1;
  }

  function lbGoTo(dir) {
    var newIdx = lbState.current + dir;
    if (newIdx < 0 || newIdx >= lbState.slides.length) return;
    lbState.current = newIdx;
    updateLightbox();
  }

  // Card click listeners
  var cardMap = [
    { selector: '.sv-card:nth-child(1)', category: 'millwork' },
    { selector: '.sv-card:nth-child(2)', category: 'cabinetry' },
    { selector: '.sv-card:nth-child(3)', category: 'restoration' },
    { selector: '.sv-card:nth-child(4)', category: 'upholstery' },
  ];

  cardMap.forEach(function(item) {
    var card = document.querySelector(item.selector);
    if (card) {
      card.addEventListener('click', function() { openLightbox(item.category); });
      // Keyboard accessible
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', 'View portfolio: ' + item.category);
      card.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(item.category); }
      });
    }
  });

  // Controls
  document.getElementById('lbPrev').addEventListener('click', function() { lbGoTo(-1); });
  document.getElementById('lbNext').addEventListener('click', function() { lbGoTo(1); });

  // Click overlay to close
  document.getElementById('lb').addEventListener('click', function(e) {
    if (e.target === this) closeLightbox();
  });

  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (!document.getElementById('lb').classList.contains('open')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  lbGoTo(-1);
    if (e.key === 'ArrowRight') lbGoTo(1);
  });

  // Touch/swipe support
  var lbTouchX = null;
  document.getElementById('lb').addEventListener('touchstart', function(e) {
    lbTouchX = e.touches[0].clientX;
  }, { passive: true });
  document.getElementById('lb').addEventListener('touchend', function(e) {
    if (lbTouchX === null) return;
    var diff = lbTouchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) lbGoTo(diff > 0 ? 1 : -1);
    lbTouchX = null;
  }, { passive: true });
  // ── Smooth anchor scroll ──
  document.querySelectorAll('a[href^="#"]').forEach(function(a) {
    a.addEventListener('click', function(e) {
      var href = a.getAttribute('href');
      if (href.length < 2) return;
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      document.getElementById('mobNav').classList.remove('open');
      window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
    });
  });

}); // end load