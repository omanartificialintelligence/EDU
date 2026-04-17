const fs = require('fs');

const files = ['components/SupervisorDashboard.tsx', 'components/TeacherDashboardV2.tsx'];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    
    // AnimatePresence fix
    content = content.replace(/<AnimatePresence mode="wait">/g, '<AnimatePresence>');
    
    // ResponsiveContainer fix
    content = content.replace(/<ResponsiveContainer\s+width="100%"\s+height="100%">/g, '<ResponsiveContainer width="100%" height={300}>');
    content = content.replace(/<ResponsiveContainer\s+width="100%"\s+height={400}>/g, '<ResponsiveContainer width="100%" height={300}>');
    
    // Replace index keys
    // Usually key={`prefix-${item.id}-${index}`} -> key={`prefix-${item.id}`}
    content = content.replace(/key=\{`([^`]+?)-\$\{(?:index|idx|i)\}`\}/g, (match, p1) => {
        // Only strip if p1 already contains an id or is decently unique
        if (p1.includes('.id') || p1.includes('.name') || p1.includes('grade') || p1.includes('subject')) {
            return `key={\`${p1}\`}`;
        }
        return match;
    });

    // Special cases where the index is embedded differently
    content = content.replace(/key=\{`([^`]+?)-\$\{idx\}`\}/g, 'key={`$1`}');
    content = content.replace(/key=\{`([^`]+?)-\$\{index\}`\}/g, 'key={`$1`}');
    
    // If we removed it, it might have trailing dashes
    content = content.replace(/-\s*`/g, '`');

    fs.writeFileSync(file, content, 'utf-8');
});
console.log("Done");
