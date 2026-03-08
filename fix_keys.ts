import fs from 'fs';

function fixFile(file: string) {
  let content = fs.readFileSync(file, 'utf-8');
  
  // Replace key={`${id}-${index}`} with key={id}
  content = content.replace(/key=\{`\$\{([^}]+)\}-\$\{([^}]+)\}`\}/g, (match, p1, p2) => {
    if (['index', 'i', 'j', 'idx'].includes(p2)) {
      return `key={${p1}}`;
    }
    return match;
  });

  // Replace key={`${id}-${id2}-${index}`} with key={`${id}-${id2}`}
  content = content.replace(/key=\{`\$\{([^}]+)\}-\$\{([^}]+)\}-\$\{([^}]+)\}`\}/g, (match, p1, p2, p3) => {
    if (['index', 'i', 'j', 'idx'].includes(p3)) {
      return `key={\`\$\{${p1}\}-\$\{${p2}\}\`}`;
    }
    return match;
  });

  fs.writeFileSync(file, content);
}

fixFile('components/SupervisorDashboard.tsx');
fixFile('components/TeacherDashboardV2.tsx');
console.log('Done');
