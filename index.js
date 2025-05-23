console.log("Hello, World!");

// Blog posts data
const blogPosts = [
  {
    title: "Why am I studying Computer Science",
    content: `<p>5 weeks ago, I started a new chapter of my life. I began studying Computer Science and IT at NUIG. My journey to this major section of my life began in childhood. Let me fill you in.</p>
<p>I remember being harassed in secondary school by my career guidance teacher, constantly demanding I tell her what I wanted to do after the Leaving Cert. I had no idea; all I knew was that I wanted to go to university (there was no way I was going to miss out on the student life!).</p>
<p>I tried picking a course based on my interests—I had so many, such as swimming, video editing, woodworking, chess... I could continue listing them all day.</p>
<p>But then it hit me.</p>
<p>While training in the pool, I would often let my mind wander while my body moved on autopilot. I made mental lists of what I wanted to achieve in life. I wanted a good job that I enjoyed, but I also wanted to know what I truly loved doing.</p>
<p>I remember the day my mom came home from work carrying a black box. She set it on the couch, and my curiosity got the better of me. I dropped my Lego pieces and moved over. I recognized the power button—it was the same as the one on our TV remote—so I pressed it. The screen lit up, just like my eyes in amazement.</p>
<p>A tiny TV?</p>
<p>No.</p>
<p>I later learned that it could do so much more than just display videos—in the coming years it would allow for button clicks, app launches, and a venture into the 8th Wonder of the World: the World Wide Web.</p>
<p>My parents noticed my interest in computers and suggested I try CoderDoJo. It started with Scratch—a cat floating across the screen—but quickly became a Snake game, Donkey Kong, and even Space Invaders. I even attended Whizzkidz one summer and learned the basics of HTML, CSS, JavaScript, and Python.</p>
<p>But one day, it all just stopped.</p>
<p>Despite that, I never lost my fascination with technology. Between watching Linus Tech Tips and investing time into researching computers before building my own PC, I always made time for tech, cherishing every minute. That is why I chose to study Computer Science.</p>
<p>I was, however, worried about getting lost during lectures after forgetting so much from Python and JavaScript. With the Leaving Cert around the corner and high points required for acceptance, I had doubts about my decision.</p>
<p>I wondered if I had chosen this path just to avoid saying "I dunno" when asked about university options. Yet, the promise of a fulfilling job propelled me forward.</p>
<p>And it paid off.</p>
<p>I got the course!</p>
<p>This was the most important decision of my life and, so far, the best one. I've met passionate people with similar interests and am enjoying my studies more than I ever expected.</p>`
  }
];

function renderBlogPosts() {
  const container = document.getElementById('blog-posts');
  container.innerHTML = '';
  blogPosts.forEach((post, idx) => {
    const article = document.createElement('article');
    article.className = 'post card';
    article.innerHTML = `
      <button class="collapsible">${post.title}</button>
      <div class="content-collapsible" style="display:none;">${post.content}</div>
    `;
    container.appendChild(article);
  });
  addCollapsibleListeners();
}

function addCollapsibleListeners() {
  document.querySelectorAll('.collapsible').forEach(btn => {
    btn.onclick = function() {
      this.classList.toggle('active');
      const content = this.nextElementSibling;
      if (content.style.display === 'block') {
        content.style.display = 'none';
      } else {
        content.style.display = 'block';
      }
    };
  });
}

// Add post form logic
const addPostBtn = document.getElementById('add-post-btn');
const addPostForm = document.getElementById('add-post-form');
if (addPostBtn && addPostForm) {
  addPostBtn.onclick = () => {
    addPostForm.style.display = addPostForm.style.display === 'none' ? 'block' : 'none';
  };
  addPostForm.onsubmit = function(e) {
    e.preventDefault();
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    if (title && content) {
      blogPosts.unshift({ title, content: `<p>${content.replace(/\n/g, '</p><p>')}</p>` });
      renderBlogPosts();
      addPostForm.reset();
      addPostForm.style.display = 'none';
    }
  };
}

// Render posts on load
if (document.getElementById('blog-posts')) renderBlogPosts();