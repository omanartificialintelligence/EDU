const fs = require('fs');

const files = ['components/SupervisorDashboard.tsx', 'components/TeacherDashboardV2.tsx'];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    
    // AnimatePresence fix
    content = content.replace(/<AnimatePresence mode="wait">/g, '<AnimatePresence>');
    
    // ResponsiveContainer fix
    content = content.replace(/<ResponsiveContainer\s+width="100%"\s+height="100%">/g, '<ResponsiveContainer width="100%" height={300}>');
    content = content.replace(/<ResponsiveContainer\s+width="100%"\s+height={400}>/g, '<ResponsiveContainer width="100%" height={300}>');
    
    // Replace keys that contain string templates, targeting the last piece which is usually index
    // e.g. key={`something-${item.id}-${idx}`} -> key={`something-${item.id}`}
    
    content = content.replace(/key=\{`([^`]+?)-\$\{(?:index|idx|i)\}`\}/g, (match, prefix) => {
        // e.g. prefix is "teacher-${teacher.id}" or "post-${post.id}"
        // Let's just remove the index for all of these as long as they appear to have dynamic content
        if (prefix.includes('$')) {
            return `key={\`${prefix}\`}`;
        }
        return match;
    });

    content = content.replace(/key=\{`([^`]+?)-\$\{(?:index|idx|i)\}`\}/g, (match, prefix) => {
        // If it doesn't have $, meaning it's like "something-${index}", maybe keep it
        return match;
    });

    fs.writeFileSync(file, content, 'utf-8');
});
console.log("Updated files!");
