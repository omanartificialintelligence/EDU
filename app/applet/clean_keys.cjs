const fs = require('fs');

function cleanKeys(file) {
    let content = fs.readFileSync(file, 'utf8');

    // General replacer for `prefix-${idx}`
    content = content.replace(/key=\{`([^`]+?)-\$\{(?:idx|index|i)\}`\}/g, (match, prefix) => {
        // EXCEPTIONS: Assignments in edit/new arrays without ID
        if (prefix.includes('assignment-') || prefix.includes('edit-assignment') || prefix.includes('new-assignment')) {
            return match;
        }
        if (prefix.includes('att-file-')) {
             return match;
        }

        return `key={\`${prefix}\`}`;
    });

    // Handle any weird edge cases
    content = content.replace(/key=\{`teacher-select-\$\{teacher\.id\}`\}/g, 'key={teacher.id}');
    content = content.replace(/key=\{`teacher-option-\$\{t\.id\}`\}/g, 'key={t.id}');

    fs.writeFileSync(file, content, 'utf8');
}

// Ensure the paths are correct for the script to run locally in the shell container,
// which runs with cwd = /app/applet.
cleanKeys('components/SupervisorDashboard.tsx');
cleanKeys('components/TeacherDashboardV2.tsx');
console.log('Done cleaning keys!');
