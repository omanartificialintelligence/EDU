import * as fs from 'fs';

const files = ['components/SupervisorDashboard.tsx', 'components/TeacherDashboardV2.tsx'];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    
    // AnimatePresence fix
    content = content.replace(/<AnimatePresence mode="wait">/g, '<AnimatePresence>');
    
    // ResponsiveContainer fix
    content = content.replace(/<ResponsiveContainer\s+width="100%"\s+height="100%">/g, '<ResponsiveContainer width="100%" height={300}>');
    content = content.replace(/<ResponsiveContainer\s+width="100%"\s+height={400}>/g, '<ResponsiveContainer width="100%" height={300}>');
    
    // Key fixes - Removing `-index`, `-idx`, `-i` from keys where an ID or safe loop value is present
    
    // Using RegExp string replacement to remove idx/index dynamically for keys that already contain an id
    // We can replace the typical patterns
    
    // Replace keys looking like key={`notif-${notification.id}-${index}`}
    content = content.replace(/key=\{`([^`]+?)-\$\{(index|idx|i)\}`\}/g, (match, prefix, indexVar) => {
        // if prefix has an id or something unique, just drop the index
        if (prefix.includes('.id') || prefix.includes('{') || prefix.includes('year') || prefix.includes('filter') || Object.keys({}).length) {
            return `key={\`${prefix}\`}`;
        }
        return match;
    });

    // Replace keys looking like key={`teacher-${teacher.id}-${i}`}
    content = content.replace(/key=\{`([^`]+?)-\$\{(?:teacher|post|msg|project|notification|att|attachment|comment|supervisor|lesson)\.id\}-\$\{(index|idx|i)\}`\}/g, 
        'key={`$1-${$2}`}' // Actually wait, the regex above handles everything cleanly
    );

    content = content.replace(/key=\{`([^`]+?)-\$\{(index|idx|i)\}`\}/g, 'key={`$1`}');
    
    // Also check strings without keys, let's just make it simpler
    content = content.replace(/\$\{index\}/g, '');
    content = content.replace(/\$\{idx\}/g, '');
    content = content.replace(/-\$\{i\}/g, '');
    content = content.replace(/-\$\{index\}/g, '');
    content = content.replace(/-\$\{idx\}/g, '');

    // Now fix empty variables that might have been left over if they were trailing
    content = content.replace(/-\s*`/g, '`');

    fs.writeFileSync(file, content, 'utf-8');
});
