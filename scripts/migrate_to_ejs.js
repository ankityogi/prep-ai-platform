const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, '..', 'views');
const publicDir = path.join(__dirname, '..', 'public');
const partialsDir = path.join(viewsDir, 'partials');

if (!fs.existsSync(partialsDir)) fs.mkdirSync(partialsDir, { recursive: true });

// 1. Write the generic navbar EJS partial
const navbarEjs = `<nav class="navbar">
    <div class="nav-brand">
        <h2>AI Interview Platform</h2>
    </div>
    <div class="nav-links">
        <a href="/dashboard" class="<%= activePage === 'dashboard' ? 'active' : '' %>">Dashboard</a>
        <a href="/interview" class="<%= activePage === 'interview' ? 'active' : '' %>">Start Interview</a>
        <a href="/results" class="<%= activePage === 'results' ? 'active' : '' %>">Results</a>
        <a href="/coding" class="<%= activePage === 'coding' ? 'active' : '' %>">Practice</a>
        <a href="/top-questions" class="<%= activePage === 'top-questions' ? 'active' : '' %>">Top Questions</a>
        <a href="/mock-test-home" class="<%= activePage === 'mock-test' ? 'active' : '' %>">Mock Test</a>
        <a href="/profile" class="<%= activePage === 'profile' ? 'active' : '' %>">Profile</a>
        <a href="/reviews" class="<%= activePage === 'reviews' ? 'active' : '' %>">Reviews</a>
    </div>
    <div class="nav-actions">
        <a href="/logout" class="logout-btn">Logout</a>
    </div>
</nav>`;
fs.writeFileSync(path.join(partialsDir, 'navbar.ejs'), navbarEjs, 'utf8');

// 2. Migrate views/*.html files
let viewFiles;
try {
    viewFiles = fs.readdirSync(viewsDir).filter(f => f.endsWith('.html'));
} catch (e) {
    viewFiles = [];
}

viewFiles.forEach(file => {
    const filePath = path.join(viewsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Find which page is active based on existing HTML
    let activePage = '';
    const activeMatch = content.match(/<a[^>]*href="\/([^"]+)"[^>]*class="[^"]*active([^"]*)"/);
    if (activeMatch) {
         if (activeMatch[1] === 'mock-test-home') activePage = 'mock-test';
         else activePage = activeMatch[1];
    } else {
         const altMatch = content.match(/<a href="\/([^"]+)"\s*class="active">/);
         if (altMatch) activePage = altMatch[1] === 'mock-test-home' ? 'mock-test' : altMatch[1];
    }

    if (!activePage) {
        if (file === 'dashboard.html') activePage = 'dashboard';
        if (file.includes('mock-test')) activePage = 'mock-test';
        if (file.includes('profile')) activePage = 'profile';
        if (file.includes('interview')) activePage = 'interview';
    }

    // Regex to remove the entire <nav class="navbar"> ... </nav> block
    const navRegex = /<nav class="navbar">[\s\S]*?<\/nav>/g;
    
    // Check if it exists and replace
    if (navRegex.test(content)) {
        content = content.replace(navRegex, `<%- include('partials/navbar', { activePage: '${activePage}' }) %>`);
    }

    const newPath = path.join(viewsDir, file.replace('.html', '.ejs'));
    fs.writeFileSync(newPath, content, 'utf8');
    fs.unlinkSync(filePath); // delete original HTML
    console.log(`Migrated ${file} -> ${path.basename(newPath)} with activePage='${activePage}'`);
});

// 3. Migrate public/index.html and public/register.html to views/
['index.html', 'register.html'].forEach(file => {
   const oldPath = path.join(publicDir, file);
   if (fs.existsSync(oldPath)) {
      const content = fs.readFileSync(oldPath, 'utf8');
      const newPath = path.join(viewsDir, file.replace('.html', '.ejs'));
      fs.writeFileSync(newPath, content, 'utf8');
      fs.unlinkSync(oldPath);
      console.log(`Migrated public/${file} -> views/${path.basename(newPath)}`);
   }
});

console.log("Migration script complete.");
