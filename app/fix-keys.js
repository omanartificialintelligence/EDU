const fs = require('fs');

function fixKeysInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Fix att.id
  content = content.replace(/key=\{att\.id( \s*\|\|\s*[^}]+)?\}/g, (match) => {
    return 'key={att.id || att.url || Math.random().toString()}';
  });

  // Fix attachment.id
  content = content.replace(/key=\{attachment\.id( \s*\|\|\s*[^}]+)?\}/g, (match) => {
    return 'key={attachment.id || attachment.url || Math.random().toString()}';
  });

  // Fix file.id
  content = content.replace(/key=\{file\.id( \s*\|\|\s*[^}]+)?\}/g, (match) => {
    return 'key={file.id || file.url || Math.random().toString()}';
  });

  // Fix msg.id (just in case)
  content = content.replace(/key=\{msg\.id( \s*\|\|\s*[^}]+)?\}/g, (match) => {
    return 'key={msg.id || Math.random().toString()}';
  });
  
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed keys in ${filePath}`);
  }
}

fixKeysInFile('components/SupervisorDashboard.tsx');
fixKeysInFile('components/TeacherDashboardV2.tsx');
if (fs.existsSync('src/components/TeacherPanel.tsx')) {
  fixKeysInFile('src/components/TeacherPanel.tsx');
}
