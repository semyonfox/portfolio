console.log('Hello, World!');

// Blog posts data
const blogPosts = [
	{
		title: 'Why am I studying Computer Science',
		author: 'Semyon Fox',
		date: '2024-11-03',
		content: `<p>Recently, I began a new chapter: studying Computer Science and IT at NUIG. Looking back, my path here was shaped long before I first sat in a lecture hall.</p>

<p>In secondary school, my career guidance teacher pestered me daily with the question, “What will you do after the Leaving Cert?” I had no answer—just the certainty that I wanted university life. I floated among interests like swimming, video editing, woodworking, and chess, unable to commit.</p>

<p>One afternoon in the pool, on autopilot during laps, I daydreamed about my future. I wanted a job I loved, but also a deep passion for the work itself.</p>

<p>That curiosity ignited at home when my mom brought in a mysterious black box—our first PC. I pressed the power button, and the screen flickered to life. It wasn’t just a tiny TV; it was a portal to something bigger. Over the years, I learned it could launch apps, connect online, and unveil the World Wide Web.</p>

<p>My parents encouraged me to join CoderDojo. I started with Scratch—making a cat glide across the screen—and soon recreated Snake, Donkey Kong, and Space Invaders. A summer at Whizzkidz taught me HTML, CSS, JavaScript, and Python. But one day, I simply stopped.</p>

<p>Despite the hiatus, my fascination with technology never waned. I devoured Linus Tech Tips videos, researched PC builds, and eventually assembled my own machine. That enduring interest is why I chose Computer Science.</p>

<p>Nervousness crept in as I feared I’d forgotten too much Python and JavaScript. With the Leaving Cert looming and high entry points required, doubts lingered: had I picked this path just to avoid saying “I dunno”? The promise of a fulfilling career pushed me forward—and it paid off: I got the course.</p>

<p>This decision stands as the most important of my life so far. I’ve met driven classmates, tackled engaging coursework, and rediscovered my love for tech every day.</p>`,
	},

	{
		title: 'Why I Switched to Linux Mint: A Student’s Experience',
		author: 'Semyon Fox',
		date: '2025-05-23',
		content: `<p>When Windows 10’s support warning popped up on my laptop last year, I felt a mix of irritation and curiosity. I’d already wrestled with Ubuntu Server for my home projects and toyed with Kali Linux, but I’d never made a full switch. That day, I decided to give my laptop a fresh start.</p>

<p>I backed up my files and wiped Windows clean. As the installer booted, I chose Linux Mint Cinnamon—attractive, stable, and with a desktop that felt oddly familiar. It was like meeting an old friend in a new city.</p>

<p>Once the install finished, I settled into the new environment. The first boot was slower than expected, but the system quickly found its rhythm. I explored the menus, tweaked the theme to a dark blue I liked, and installed VS Code for coding. It felt liberating to press Ctrl+Alt+T and open a terminal without fear—yet I rarely used it except to troubleshoot minor hiccups.</p>

<p>My HP EliteBook’s Wi-Fi drove me nuts at first—Eduroam required hidden settings—but a forum thread on Reddit saved the day. At university, hooking up my USB-C dock sometimes made external monitors flicker, reminding me that no system is perfect. Multiple reboots later, I mostly shrugged and copied logs for next time.</p>

<p>Battery life surprised me: an extra 20% during long library sessions. Playing Minecraft, I noticed a small FPS bump. For heavy AAA titles, I still boot into Windows on my desktop, but for everything else—coding, note-taking in Obsidian, streaming lectures—Mint handled it flawlessly.</p>

<p>One evening, an AI-suggested command I didn’t fully understand wiped out critical system files. Panic hit, but Timeshift snapshots restored everything within minutes. The experience taught me respect for backups and the strength of the community backing Mint.</p>

<p>Now, every morning, I open my laptop to a snappy login, the familiar Cinnamon panel waiting. I customize themes on weekends, share fixes on the forums, and enjoy a system that feels truly mine. Linux Mint didn’t just replace Windows—it breathed new life into my daily routine.</p>`,
	},
];

function renderBlogPosts() {
	const container = document.getElementById('blog-posts');
	container.innerHTML = '';
	blogPosts.forEach((post, idx) => {
		const article = document.createElement('article');
		article.className = 'post card';
		const date = post.date
			? `<span class="blog-date">${new Date(
					post.date
			  ).toLocaleDateString()}</span>`
			: '';
		const author = post.author
			? `<span class="blog-author">by ${post.author}</span>`
			: '';
		article.innerHTML = `
			<header class="post-header">
				<h3 class="post-title">${post.title}</h3>
				<div class="post-meta">${author} ${date}</div>
			</header>
			<div class="blog-actions">
				<button class="read-aloud-btn" data-idx="${idx}" aria-label="Read post aloud"><i class="fas fa-volume-up"></i> Read Aloud</button>
				<button class="collapsible" aria-expanded="false" aria-controls="post-content-${idx}">Read More</button>
			</div>
			<div class="content-collapsible" id="post-content-${idx}" style="display:none;">${post.content}</div>
		`;
		container.appendChild(article);
	});
	addCollapsibleListeners();
	addReadAloudListeners();
}

function addCollapsibleListeners() {
	document.querySelectorAll('.collapsible').forEach((btn) => {
		btn.onclick = function () {
			const expanded = this.getAttribute('aria-expanded') === 'true';
			this.setAttribute('aria-expanded', String(!expanded));
			this.classList.toggle('active');
			const content = this.closest('.blog-actions').nextElementSibling;
			if (content && content.classList.contains('content-collapsible')) {
				content.style.display =
					content.style.display === 'block' ? 'none' : 'block';
			}
		};
	});
}

function addReadAloudListeners() {
	const synth = window.speechSynthesis;
	let currentUtterance = null;
	let currentBtn = null;

	document.querySelectorAll('.read-aloud-btn').forEach((btn) => {
		btn.onclick = null;
	});

	document.querySelectorAll('.read-aloud-btn').forEach((btn) => {
		btn.onclick = function () {
			if (synth.speaking || synth.pending) {
				synth.cancel();
				if (currentBtn)
					currentBtn.innerHTML = '<i class="fas fa-volume-up"></i> Read Aloud';
				if (currentBtn === btn) {
					currentBtn = null;
					return;
				}
			}
			const idx = btn.getAttribute('data-idx');
			const tempDiv = document.createElement('div');
			tempDiv.innerHTML = blogPosts[idx].content;
			const text = tempDiv.textContent || tempDiv.innerText || '';
			if (!text) return;
			const utter = new SpeechSynthesisUtterance(text);
			currentUtterance = utter;
			currentBtn = btn;
			btn.innerHTML = '<i class="fas fa-stop"></i> Stop';
			btn.setAttribute('aria-pressed', 'true');
			utter.onend = utter.onerror = function () {
				btn.innerHTML = '<i class="fas fa-volume-up"></i> Read Aloud';
				btn.setAttribute('aria-pressed', 'false');
				currentUtterance = null;
				currentBtn = null;
			};
			synth.speak(utter);
		};
	});
}

// Add post form logic
const addPostBtn = document.getElementById('add-post-btn');
const addPostForm = document.getElementById('add-post-form');
if (addPostBtn && addPostForm) {
	addPostBtn.onclick = () => {
		addPostForm.style.display =
			addPostForm.style.display === 'none' ? 'block' : 'none';
	};
	addPostForm.onsubmit = function (e) {
		e.preventDefault();
		const title = document.getElementById('post-title').value.trim();
		const content = document.getElementById('post-content').value.trim();
		if (title && content) {
			blogPosts.unshift({
				title,
				author: 'Semyon Fox',
				date: new Date().toISOString().split('T')[0],
				content: `<p>${content.replace(/\n/g, '</p><p>')}</p>`,
			});
			renderBlogPosts();
			addPostForm.reset();
			addPostForm.style.display = 'none';
		}
	};
}

// Render posts on load
if (document.getElementById('blog-posts')) renderBlogPosts();
