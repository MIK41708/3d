    // --- REGISTRO DO SCROLLTRIGGER DO GSAP ---
    gsap.registerPlugin(ScrollTrigger);

    // --- CENA THREE.JS ---
    const container = document.getElementById('webgl-container');
    const scene = new THREE.Scene();

    // Câmera
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 8); // Inicialmente bem próxima (Escala Hero)

    // Renderizador com suporte a Alpha (Transparência para o fundo CSS)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // --- ILUMINAÇÃO DE ESTÚDIO 3D ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Refletor Principal (SpotLight 3D) atrás e acima
    const spotLight = new THREE.SpotLight(0x00e5ff, 5);
    spotLight.position.set(0, 12, -5);
    spotLight.angle = Math.PI / 3;
    spotLight.penumbra = 0.8;
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 2048;
    spotLight.shadow.mapSize.height = 2048;
    scene.add(spotLight);

    // Luz de Preenchimento Secundária
    const fillLight = new THREE.PointLight(0xff6b35, 2, 20);
    fillLight.position.set(-6, -2, 4);
    scene.add(fillLight);

    // Plano Chão Receptor de Sombras
    const shadowFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.ShadowMaterial({ opacity: 0.3 })
    );
    shadowFloor.rotation.x = -Math.PI / 2;
    shadowFloor.position.y = -4;
    shadowFloor.receiveShadow = true;
    scene.add(shadowFloor);

    // --- CONSTRUÇÃO DO MODELO ATÔMICO 3D (ÁTOMO DE BORO - B11) ---
    const atomGroup = new THREE.Group();
    scene.add(atomGroup);

    // Materiais
    const protonMaterial = new THREE.MeshStandardMaterial({
      color: 0xff3366,
      roughness: 0.2,
      metalness: 0.5,
      emissive: 0x550011,
      emissiveIntensity: 0.2
    });

    const neutronMaterial = new THREE.MeshStandardMaterial({
      color: 0x4488ff,
      roughness: 0.3,
      metalness: 0.3,
      emissive: 0x001144,
      emissiveIntensity: 0.2
    });

    const electronMaterial = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.8
    });

    const orbitMaterial = new THREE.LineBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.25
    });

    window.updateAtomPalette = (mode) => {
      const palettes = {
        standard: { proton: 0xff3366, neutron: 0x4488ff, electron: 0x00e5ff, orbit: 0x00e5ff },
        protanopia: { proton: 0xe69f00, neutron: 0x0072b2, electron: 0x009e73, orbit: 0x0072b2 },
        deuteranopia: { proton: 0xd55e00, neutron: 0x0072b2, electron: 0x56b4e9, orbit: 0x0072b2 },
        tritanopia: { proton: 0xd55e00, neutron: 0x009e73, electron: 0x0072b2, orbit: 0x009e73 }
      };
      const palette = palettes[mode] || palettes.standard;
      protonMaterial.color.setHex(palette.proton);
      neutronMaterial.color.setHex(palette.neutron);
      electronMaterial.color.setHex(palette.electron);
      electronMaterial.emissive.setHex(palette.electron);
      orbitMaterial.color.setHex(palette.orbit);
    };

    const spheres = []; // Guarda dados de animação de explosão das partículas subatômicas

    // 1. Criar Núcleo (5 Prótons + 6 Nêutrons)
    const sphereGeo = new THREE.SphereGeometry(0.32, 32, 32);
    const particleCount = 11;

    for (let i = 0; i < particleCount; i++) {
      const isProton = i % 2 === 0;
      const mesh = new THREE.Mesh(sphereGeo, isProton ? protonMaterial : neutronMaterial);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Posição inicial no núcleo compacto (distribuição esférica)
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;
      const radius = 0.55;

      const basePos = new THREE.Vector3(
        radius * Math.cos(theta) * Math.sin(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(phi)
      );

      mesh.position.copy(basePos);

      // Posição de Explosão (afastando-se do centro)
      const explodePos = basePos.clone().multiplyScalar(4.5);

      atomGroup.add(mesh);

      spheres.push({
        mesh: mesh,
        basePos: basePos,
        explodePos: explodePos
      });
    }

    // 2. Criar Orbitais e Elétrons (5 Elétrons)
    const electronGroup = new THREE.Group();
    atomGroup.add(electronGroup);

    const orbitRaddi = [2.2, 2.2, 3.8, 3.8, 3.8];
    const orbitRotations = [
      { x: Math.PI / 4, y: 0 },
      { x: -Math.PI / 4, y: Math.PI / 3 },
      { x: Math.PI / 2, y: 0 },
      { x: 0, y: Math.PI / 3 },
      { x: Math.PI / 3, y: -Math.PI / 3 }
    ];

    const electronMeshes = [];

    orbitRaddi.forEach((radius, i) => {
      const orbitRing = new THREE.Group();
      orbitRing.rotation.x = orbitRotations[i].x;
      orbitRing.rotation.y = orbitRotations[i].y;

      // Desenhar Linha de Órbita
      const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, 2 * Math.PI, false, 0);
      const points = curve.getPoints(64);
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(
        points.map(p => new THREE.Vector3(p.x, p.y, 0))
      );
      const orbitLine = new THREE.Line(orbitGeo, orbitMaterial);
      orbitRing.add(orbitLine);

      // Criar Elétron
      const electronGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const electron = new THREE.Mesh(electronGeo, electronMaterial);
      electron.castShadow = true;
      orbitRing.add(electron);

      electronGroup.add(orbitRing);

      electronMeshes.push({
        mesh: electron,
        radius: radius,
        speed: 1.5 + i * 0.5,
        angle: (i * Math.PI * 2) / 5,
        orbitRing: orbitRing
      });
    });

    // --- ANIMAÇÃO DE SCROLL COM GSAP + SCROLLTRIGGER ---
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: ".scroll-track",
        start: "top top",
        end: "bottom bottom",
        scrub: 1 // Suavização na rolagem
      }
    });

    // Fase 1: Escala Hero -> Câmera Afasta (Zoom Out)
    timeline.to(camera.position, {
      z: 14,
      y: 2,
      duration: 2,
      ease: "power2.inOut"
    }, 0);

    // Fase 2: Visão Explodida (Puxa os Prótons e Nêutrons para fora)
    spheres.forEach(item => {
      timeline.to(item.mesh.position, {
        x: item.explodePos.x,
        y: item.explodePos.y,
        z: item.explodePos.z,
        duration: 2.5,
        ease: "power3.out"
      }, 1.5);
    });

    // Expansão dos Orbitais durante a visão explodida
    electronMeshes.forEach(item => {
      timeline.to(item.orbitRing.scale, {
        x: 1.8,
        y: 1.8,
        z: 1.8,
        duration: 2.5,
        ease: "power3.out"
      }, 1.5);
    });

    // Fase 3: Sequência de Câmera Orbitando 360 Graus
    timeline.to(atomGroup.rotation, {
      y: Math.PI * 2,
      x: Math.PI * 0.2,
      duration: 4,
      ease: "none"
    }, 2);

    // --- INTERATIVIDADE COM MOUSE (PARALLAX E SPOTLIGHT) ---
    let mouseX = 0;
    let mouseY = 0;
    const bgStudio = document.getElementById('studio-background');

    window.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;

      // Move suavemente a iluminação 3D acompanhando o cursor
      gsap.to(spotLight.position, {
        x: mouseX * 8,
        y: 12 + mouseY * 4,
        duration: 0.8,
        ease: "power2.out"
      });

      // Atualiza o gradiente radial CSS no fundo
      const moveX = 50 + mouseX * 15;
      const moveY = 40 - mouseY * 15;
      const studioColors = getComputedStyle(document.documentElement);
      bgStudio.style.background = `radial-gradient(circle at ${moveX}% ${moveY}%, ${studioColors.getPropertyValue('--studio-a')} 0%, ${studioColors.getPropertyValue('--studio-b')} 70%, ${studioColors.getPropertyValue('--studio-c')} 100%)`;
    });

    // --- LOOP DE RENDERIZAÇÃO 3D (ANIMATION LOOP) ---
    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Mover elétrons em suas órbitas contínuas
      electronMeshes.forEach(item => {
        item.angle += 0.02 * item.speed;
        item.mesh.position.x = Math.cos(item.angle) * item.radius;
        item.mesh.position.y = Math.sin(item.angle) * item.radius;
      });

      // Rotação suave constante e sutil do átomo completo
      atomGroup.rotation.z = elapsedTime * 0.05;

      // Movimento suave de respiração no parallax do mouse
      camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;

      renderer.render(scene, camera);
    }

    animate();

    // --- REDIMENSIONAMENTO DE TELA (RESPONSIVIDADE) ---
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
    const accountButton = document.getElementById('accountButton');
    const accountModal = document.getElementById('accountModal');
    const profileModal = document.getElementById('profileModal');
    const accountForm = document.getElementById('accountForm');
    const storedUser = () => JSON.parse(localStorage.getItem('quimica-user') || 'null');
    let signUpMode = false;

    function updateProfile() {
      const user = storedUser();
      const name = user ? user.name : 'Visitante';
      document.getElementById('accountLabel').textContent = 'Cadastrar';
      document.getElementById('profileName').textContent = name;
      document.getElementById('profileNameInput').value = user ? name : '';
      const photo = localStorage.getItem('quimica-profile-image');
      document.querySelectorAll('#headerAvatar, #profileAvatar').forEach((avatar) => {
        avatar.innerHTML = photo ? `<img src="${photo}" alt="Foto do perfil">` : name.charAt(0).toUpperCase();
      });
    }

    function openSignup() {
      signUpMode = true;
      document.getElementById('nameField').hidden = false;
      document.getElementById('accountTitle').textContent = 'Cadastro';
      document.getElementById('accountSubtitle').textContent = 'Crie sua conta para acompanhar seus estudos.';
      document.getElementById('accountSubmit').textContent = 'Cadastrar';
      document.getElementById('switchAccount').textContent = 'Voltar para entrar';
      document.getElementById('accountStatus').textContent = '';
      accountModal.classList.add('open');
    }
    accountButton.addEventListener('click', () => {
      document.getElementById('accountStatus').textContent = '';
      openSignup();
    });
    document.getElementById('profileButton').addEventListener('click', () => profileModal.classList.add('open'));
    document.getElementById('whatsappButton').addEventListener('click', (event) => { event.preventDefault(); document.getElementById('whatsappModal').classList.add('open'); });
    document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => document.getElementById(button.dataset.close).classList.remove('open')));
    document.querySelectorAll('.modal-backdrop').forEach((modal) => modal.addEventListener('click', (event) => { if (event.target === modal) modal.classList.remove('open'); }));
    document.getElementById('switchAccount').addEventListener('click', () => {
      signUpMode = !signUpMode;
      document.getElementById('nameField').hidden = !signUpMode;
      document.getElementById('accountTitle').textContent = signUpMode ? 'Cadastro' : 'Entrar';
      document.getElementById('accountSubtitle').textContent = signUpMode ? 'Crie sua conta para acompanhar seus estudos.' : 'Acesse seu espaço de estudos.';
      document.getElementById('accountSubmit').textContent = signUpMode ? 'Cadastrar' : 'Entrar';
      document.getElementById('switchAccount').textContent = signUpMode ? 'Voltar para entrar' : 'Criar cadastro';
      document.getElementById('accountStatus').textContent = '';
    });
    accountForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = document.getElementById('accountEmail').value;
      const name = signUpMode ? document.getElementById('accountName').value || email.split('@')[0] : email.split('@')[0];
      localStorage.setItem('quimica-user', JSON.stringify({ name, email }));
      accountModal.classList.remove('open');
      updateProfile();
      signUpMode = false;
      document.getElementById('accountStatus').textContent = 'Conta acessada com sucesso.';
    });
    document.getElementById('profileImage').addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => { localStorage.setItem('quimica-profile-image', reader.result); updateProfile(); };
      reader.readAsDataURL(file);
    });
    document.getElementById('profileNameForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const name = document.getElementById('profileNameInput').value.trim();
      if (!name) return;
      const user = storedUser() || { email: '' };
      localStorage.setItem('quimica-user', JSON.stringify({ ...user, name }));
      updateProfile();
    });
    document.getElementById('logoutButton').addEventListener('click', () => { localStorage.removeItem('quimica-user'); localStorage.removeItem('quimica-profile-image'); profileModal.classList.remove('open'); updateProfile(); });
    document.getElementById('themeButton').addEventListener('click', () => {
      const light = document.documentElement.dataset.theme === 'light';
      document.documentElement.dataset.theme = light ? 'dark' : 'light';
      document.getElementById('themeButton').textContent = light ? 'Modo claro' : 'Modo escuro';
      localStorage.setItem('quimica-theme', light ? 'dark' : 'light');
    });
    const savedTheme = localStorage.getItem('quimica-theme') || 'dark';
    document.documentElement.dataset.theme = savedTheme;
    document.getElementById('themeButton').textContent = savedTheme === 'light' ? 'Modo escuro' : 'Modo claro';
    const languages = ['PT', 'EN', '中文', 'ES'];
    const colorModes = [
      { id: 'standard', label: 'Cores' },
      { id: 'protanopia', label: 'Protanopia' },
      { id: 'deuteranopia', label: 'Deuteranopia' },
      { id: 'tritanopia', label: 'Tritanopia' }
    ];
    let currentColorMode = localStorage.getItem('quimica-color-mode') || 'standard';
    function applyColorMode(mode) {
      currentColorMode = mode;
      document.documentElement.dataset.colorMode = mode === 'standard' ? '' : mode;
      const selectedMode = colorModes.find((colorMode) => colorMode.id === mode) || colorModes[0];
      document.getElementById('colorButton').textContent = 'Mudar de cor';
      document.getElementById('colorButton').title = `Mudar de cor: ${selectedMode.label}`;
      document.getElementById('colorButton').setAttribute('aria-label', `Mudar de cor. Paleta atual: ${selectedMode.label}`);
      const studioColors = getComputedStyle(document.documentElement);
      document.getElementById('studio-background').style.background = `radial-gradient(circle at 50% 40%, ${studioColors.getPropertyValue('--studio-a')} 0%, ${studioColors.getPropertyValue('--studio-b')} 70%, ${studioColors.getPropertyValue('--studio-c')} 100%)`;
      if (window.updateAtomPalette) window.updateAtomPalette(mode);
      localStorage.setItem('quimica-color-mode', mode);
    }
    document.getElementById('colorButton').addEventListener('click', () => {
      const currentIndex = colorModes.findIndex((mode) => mode.id === currentColorMode);
      applyColorMode(colorModes[(currentIndex + 1) % colorModes.length].id);
    });
    applyColorMode(currentColorMode);
    const languageData = {
      PT: { html: 'pt-BR', theme: ['Modo claro', 'Modo escuro'], enter: 'Entrar', scroll: 'ROLE PARA EXPLORAR', tags: ['Estrutura Atômica', 'Fase 01 — Escala Quântica', 'Fase 02 — Visão Explodida', 'Fase 03 — Análise 360°', 'Conteúdo', 'Aulas', 'Prática', 'Experimentos', 'Eletroquímica', 'Desafio final'], titles: ['ÁTOMO DE BORO', 'Camadas Eletrônicas', 'Desconstrução de Núcleos', 'Geometria das Partículas'], atom: ['Explore a matéria no seu nível mais fundamental. Role a página para iniciar o zoom e desacoplar o modelo atômico em visão explodida.', 'Os elétrons orbitam em torno do núcleo denso em níveis discretos de energia. Afastando a câmera, revelamos o sistema orbital completo do elemento.', 'A força nuclear forte é superada na simulação visual, revelando a composição individual do núcleo: 5 Prótons e 6 Nêutrons.', 'Análise tridimensional e espacial das forças quânticas subatômicas em rotação contínua de 360 graus.'], content: ['Aprenda química do seu jeito', 'Escolha uma atividade para continuar seus estudos, revisar os assuntos e praticar o que aprendeu.'], nav: ['Vídeos', 'Jogo educacional', 'PhET', 'Bond Breaker', 'Provão'], cards: ['Vídeos', 'Jogo educacional', 'PhET', 'Bond Breaker 2.0', 'Provão'], cardTags: ['Aulas', 'Prática', 'Experimentos', 'Eletroquímica', 'Desafio final'], cardText: ['Assista às resoluções do Enem e acompanhe o raciocínio passo a passo.', 'Aprenda se divertindo com desafios de química.', 'Teste experimentos práticos e observe os conceitos em ação.', 'Explore ligações químicas em uma experiência interativa.', 'Teste seus conhecimentos e veja o quanto você evoluiu.'], links: ['Resolução 2023', 'Resolução 2024', 'Resolução 2025', 'Começar jogo', 'Entrar no PhET', 'Entrar', 'Começar provão'] },
      EN: { html: 'en', theme: ['Light mode', 'Dark mode'], enter: 'Sign in', scroll: 'SCROLL TO EXPLORE', tags: ['Atomic Structure', 'Phase 01 — Quantum Scale', 'Phase 02 — Exploded View', 'Phase 03 — 360° Analysis', 'Content', 'Lessons', 'Practice', 'Experiments', 'Electrochemistry', 'Final challenge'], titles: ['BORON ATOM', 'Electron Shells', 'Nucleus Breakdown', 'Particle Geometry'], atom: ['Explore matter at its most fundamental level. Scroll to zoom in and separate the atomic model into an exploded view.', 'Electrons orbit the dense nucleus at discrete energy levels. Pulling the camera back reveals the complete orbital system.', 'The simulation reveals the nucleus composition: 5 protons and 6 neutrons.', 'A three-dimensional analysis of subatomic particles in continuous 360-degree rotation.'], content: ['Learn chemistry your way', 'Choose an activity to continue studying, review concepts and practice what you learned.'], nav: ['Videos', 'Educational game', 'PhET', 'Bond Breaker', 'Final exam'], cards: ['Videos', 'Educational game', 'PhET', 'Bond Breaker 2.0', 'Final exam'], cardTags: ['Lessons', 'Practice', 'Experiments', 'Electrochemistry', 'Final challenge'], cardText: ['Watch exam solutions and follow the reasoning step by step.', 'Learn through fun chemistry challenges.', 'Test practical experiments and see concepts in action.', 'Explore chemical bonds in an interactive experience.', 'Test your knowledge and see your progress.'], links: ['2023 solution', '2024 solution', '2025 solution', 'Start game', 'Open PhET', 'Open', 'Start final exam'] },
      '中文': { html: 'zh-CN', theme: ['浅色模式', '深色模式'], enter: '登录', scroll: '向下滚动探索', tags: ['原子结构', '阶段 01 — 量子尺度', '阶段 02 — 爆炸视图', '阶段 03 — 360° 分析', '内容', '课程', '练习', '实验', '电化学', '最终挑战'], titles: ['硼原子', '电子层', '原子核分解', '粒子几何'], atom: ['探索物质最基本的层次。向下滚动，开始缩放并分离原子模型。', '电子在不同能级围绕致密的原子核运动。镜头拉远后，可以看到完整的轨道系统。', '模拟展示原子核组成：5个质子和6个中子。', '以360度连续旋转的方式分析亚原子粒子的三维结构。'], content: ['用自己的方式学习化学', '选择一项活动继续学习、复习知识并练习所学内容。'], nav: ['视频', '教育游戏', 'PhET', 'Bond Breaker', '最终考试'], cards: ['视频', '教育游戏', 'PhET', 'Bond Breaker 2.0', '最终考试'], cardTags: ['课程', '练习', '实验', '电化学', '最终挑战'], cardText: ['观看考试题目解析，跟随每一步思路学习。', '通过有趣的化学挑战学习。', '进行实践实验，观察概念如何运作。', '在互动体验中探索化学键。', '测试你的知识，看看自己的进步。'], links: ['2023年解析', '2024年解析', '2025年解析', '开始游戏', '进入 PhET', '进入', '开始考试'] },
      ES: { html: 'es', theme: ['Modo claro', 'Modo oscuro'], enter: 'Entrar', scroll: 'DESLIZA PARA EXPLORAR', tags: ['Estructura atómica', 'Fase 01 — Escala cuántica', 'Fase 02 — Vista ampliada', 'Fase 03 — Análisis 360°', 'Contenido', 'Clases', 'Práctica', 'Experimentos', 'Electroquímica', 'Desafío final'], titles: ['ÁTOMO DE BORO', 'Capas electrónicas', 'Descomposición del núcleo', 'Geometría de partículas'], atom: ['Explora la materia en su nivel más fundamental. Desliza para ampliar y separar el modelo atómico.', 'Los electrones orbitan el núcleo denso en niveles discretos de energía. Al alejar la cámara vemos el sistema orbital completo.', 'La simulación revela la composición del núcleo: 5 protones y 6 neutrones.', 'Análisis tridimensional de partículas subatómicas en rotación continua de 360 grados.'], content: ['Aprende química a tu manera', 'Elige una actividad para continuar tus estudios, repasar conceptos y practicar lo aprendido.'], nav: ['Videos', 'Juego educativo', 'PhET', 'Bond Breaker', 'Examen final'], cards: ['Videos', 'Juego educativo', 'PhET', 'Bond Breaker 2.0', 'Examen final'], cardTags: ['Clases', 'Práctica', 'Experimentos', 'Electroquímica', 'Desafío final'], cardText: ['Mira resoluciones del examen y sigue el razonamiento paso a paso.', 'Aprende jugando con desafíos de química.', 'Prueba experimentos prácticos y observa los conceptos.', 'Explora los enlaces químicos en una experiencia interactiva.', 'Pon a prueba tus conocimientos y observa tu progreso.'], links: ['Resolución 2023', 'Resolución 2024', 'Resolución 2025', 'Comenzar juego', 'Entrar en PhET', 'Entrar', 'Comenzar examen'] }
    };
    const accountTranslations = {
      PT: ['Entrar', 'Nome', 'E-mail', 'Senha', 'Ainda não tem cadastro?', 'Criar cadastro', 'Perfil', 'Baixar imagem do computador', 'Sair da conta'],
      EN: ['Sign in', 'Name', 'Email', 'Password', "Don't have an account?", 'Create account', 'Profile', 'Upload image from computer', 'Sign out'],
      '中文': ['登录', '姓名', '电子邮箱', '密码', '还没有账户？', '创建账户', '个人资料', '从电脑上传图片', '退出账户'],
      ES: ['Entrar', 'Nombre', 'Correo', 'Contraseña', '¿Aún no tienes cuenta?', 'Crear cuenta', 'Perfil', 'Subir imagen desde el ordenador', 'Salir de la cuenta']
    };
    let currentLanguage = localStorage.getItem('quimica-language') || 'PT';
    const setText = (selector, value) => { const element = document.querySelector(selector); if (element) element.textContent = value; };
    function applyLanguage(language) {
      const data = languageData[language];
      currentLanguage = language;
      document.documentElement.lang = data.html;
      document.getElementById('languageButton').textContent = language;
      document.getElementById('themeButton').textContent = document.documentElement.dataset.theme === 'light' ? data.theme[1] : data.theme[0];
      document.querySelectorAll('.tag').forEach((element, index) => { if (data.tags[index]) element.textContent = data.tags[index]; });
      document.querySelectorAll('.content-overlay .section').forEach((section, index) => { setText(`.content-overlay .section:nth-child(${index + 1}) h1, .content-overlay .section:nth-child(${index + 1}) h2`, data.titles[index]); setText(`.content-overlay .section:nth-child(${index + 1}) p`, data.atom[index]); });
      setText('.scroll-indicator span', data.scroll); setText('.extra-content h2', data.content[0]); setText('.extra-intro', data.content[1]);
      setText('#readerLanguage', `Idioma: ${language === 'PT' ? 'Português' : language === 'EN' ? 'English' : language === '中文' ? '普通话' : 'Español'}`);
      document.querySelectorAll('.content-links a').forEach((element, index) => { element.textContent = data.nav[index]; });
      document.querySelectorAll('.resource-card h3').forEach((element, index) => { element.textContent = data.cards[index]; });
      document.querySelectorAll('.resource-card .tag').forEach((element, index) => { element.textContent = data.cardTags[index]; });
      document.querySelectorAll('.resource-card p').forEach((element, index) => { element.textContent = data.cardText[index]; });
      document.querySelectorAll('.resource-card a').forEach((element, index) => { element.textContent = data.links[index]; });
      document.getElementById('accountLabel').textContent = 'Cadastrar';
      const accountText = accountTranslations[language];
      document.getElementById('accountTitle').textContent = signUpMode ? accountText[5] : accountText[0];
      document.querySelector('#nameField').childNodes[0].textContent = accountText[1];
      document.querySelector('.account-form label:nth-of-type(2)').childNodes[0].textContent = accountText[2];
      document.querySelector('.account-form label:nth-of-type(3)').childNodes[0].textContent = accountText[3];
      document.getElementById('accountSubmit').textContent = signUpMode ? accountText[5] : accountText[0];
      document.querySelector('.account-form p').childNodes[0].textContent = `${accountText[4]} `;
      document.getElementById('switchAccount').textContent = signUpMode ? accountText[0] : accountText[5];
      document.querySelector('#profileModal h2').textContent = accountText[6];
      document.querySelector('.upload-label').childNodes[0].textContent = accountText[7];
      document.getElementById('logoutButton').textContent = accountText[8];
      localStorage.setItem('quimica-language', language);
    }
    document.getElementById('languageButton').addEventListener('click', () => applyLanguage(languages[(languages.indexOf(currentLanguage) + 1) % languages.length]));
    applyLanguage(currentLanguage);
    updateProfile();

    const readerPanel = document.getElementById('readerPanel');
    const readerButton = document.getElementById('readerButton');
    let remoteAudio = null;
    let remoteChunks = [];
    let remoteChunkIndex = 0;
    const readableContent = () => Array.from(document.querySelectorAll('.content-overlay h1, .content-overlay h2, .content-overlay p, .extra-content h2, .extra-content p, .resource-card h3, .resource-card p, .site-footer p')).map((element) => element.textContent.trim()).filter(Boolean).join('. ');
    readerButton.addEventListener('click', () => {
      const isOpen = readerPanel.classList.toggle('open');
      readerButton.setAttribute('aria-expanded', String(isOpen));
    });
    function getRemoteLanguage() {
      const language = document.documentElement.lang || 'pt-BR';
      return language === 'pt-BR' ? 'pt' : language === 'zh-CN' ? 'zh-CN' : language.split('-')[0];
    }
    function getTextChunks(text) {
      const sentences = text.match(/[^.!?。！？]+[.!?。！？]*/g) || [text];
      const chunks = [];
      let current = '';
      sentences.forEach((sentence) => {
        if ((current + sentence).length > 180 && current) { chunks.push(current.trim()); current = ''; }
        current += `${sentence} `;
      });
      if (current.trim()) chunks.push(current.trim());
      return chunks;
    }
    function playRemoteChunk(status) {
      if (remoteChunkIndex >= remoteChunks.length) { status.textContent = 'Leitura concluída'; return; }
      remoteAudio = document.getElementById('readerAudio');
      remoteAudio.src = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${getRemoteLanguage()}&q=${encodeURIComponent(remoteChunks[remoteChunkIndex])}`;
      remoteAudio.load();
      remoteAudio.volume = 1;
      remoteAudio.onended = () => { remoteChunkIndex += 1; playRemoteChunk(status); };
      remoteAudio.onerror = () => { status.textContent = 'Não foi possível carregar o áudio. Verifique sua conexão.'; };
      remoteAudio.play().then(() => { status.textContent = `Lendo em ${document.documentElement.lang}`; }).catch(() => { status.textContent = 'Clique em Ler site novamente para liberar o áudio.'; });
    }
    function speakSite() {
      const status = document.getElementById('readerLanguage');
      if (remoteAudio) remoteAudio.pause();
      remoteChunks = getTextChunks(readableContent());
      remoteChunkIndex = 0;
      playRemoteChunk(status);
    }
    document.getElementById('readStart').addEventListener('click', speakSite);
    document.getElementById('readPause').addEventListener('click', () => {
      if (remoteAudio?.src) remoteAudio.pause();
      document.getElementById('readerLanguage').textContent = 'Leitura pausada';
    });
    document.getElementById('readResume').addEventListener('click', () => {
      const status = document.getElementById('readerLanguage');
      if (!remoteAudio?.src) { speakSite(); return; }
      remoteAudio.play().then(() => { status.textContent = `Lendo em ${document.documentElement.lang}`; }).catch(() => { status.textContent = 'Clique no controle de áudio para continuar.'; });
    });
    document.getElementById('readStop').addEventListener('click', () => {
      if (remoteAudio) { remoteAudio.pause(); remoteAudio.removeAttribute('src'); remoteAudio.load(); }
      remoteAudio = null;
      remoteChunks = [];
      remoteChunkIndex = 0;
      document.getElementById('readerLanguage').textContent = 'Leitura parada';
    });
    if (window.VLibras) new window.VLibras.Widget('https://vlibras.gov.br/app');