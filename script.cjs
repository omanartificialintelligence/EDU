const fs = require('fs');

const files = ['/components/SupervisorDashboard.tsx', '/components/TeacherDashboardV2.tsx'];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    
    // AnimatePresence fix
    content = content.replace(/<AnimatePresence mode="wait">/g, '<AnimatePresence>');
    
    // ResponsiveContainer fix
    content = content.replace(/<ResponsiveContainer\s+width="100%"\s+height="100%">/g, '<ResponsiveContainer width="100%" height={300}>');
    content = content.replace(/<ResponsiveContainer\s+width="100%"\s+height={400}>/g, '<ResponsiveContainer width="100%" height={300}>');
    
    // Replace keys that contain string templates, targeting the last piece which is usually index
    content = content.replace(/key=\{`([^`]+?)-\$\{(?:index|idx|i)\}`\}/g, (match, prefix) => {
        if (prefix.includes('$')) {
            return `key={\`${prefix}\`}`;
        }
        return match;
    });

    content = content.replace(/key=\{`([a-zA-Z0-9_-]+)-\$\{(?:index|idx|i)\}`\}/gi, (match, p1) => {
        return match;
    });

    fs.writeFileSync(file, content, 'utf-8');
});
console.log("Updated files recursively...");
