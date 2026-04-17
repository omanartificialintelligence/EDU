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
    // First, notification
    content = content.replace(/key={{?`notification-\$\{([^}]+)\}-\$\{index\}`}}?/g, 'key={`notification-${$1}`}');
    content = content.replace(/key={{?`notif-\$\{([^}]+)\}-\$\{index\}`}}?/g, 'key={`notif-${$1}`}');
    // Widgets
    content = content.replace(/key={{?`widget-\$\{([^}]+)\}-\$\{index\}`}}?/g, 'key={`widget-${$1}`}');
    content = content.replace(/key={{?`widget-\$\{([^}]+)\}-\$\{idx\}`}}?/g, 'key={`widget-${$1}`}');
    // Stat
    content = content.replace(/key={{?`stat-\$\{([^}]+)\}`}}?/g, 'key={`stat-${$1}`}');
    content = content.replace(/key={{?`cell-\$\{([^}]+)\}-\$\{index\}`}}?/g, 'key={`cell-${$1}`}');
    // Teacher
    content = content.replace(/key={{?`teacher-\$\{([^}]+)\}-\$\{i\}`}}?/g, 'key={`teacher-${$1}`}');
    content = content.replace(/key={{?`teacher-option-\$\{([^}]+)\}`}}?/g, 'key={`teacher-option-${$1}`}');
    // Grade/Subject Selects (many forms!)
    for (let c=1; c<=4; c++) {
        content = content.replace(new RegExp(`key={{?\`grade\\-select\\-${c}\\-\\$\\{([^}]+)\\}\\`}}?`, 'g'), 'key={`grade-select-'+c+'-${$1}`}');
        content = content.replace(new RegExp(`key={{?\`subject\\-select\\-${c}\\-\\$\\{([^}]+)\\}\\`}}?`, 'g'), 'key={`subject-select-'+c+'-${$1}`}');
    }
    // Assignment
    content = content.replace(/key={{?`new-assignment-\$\{([^}]+)\}-\$\{([^}]+)\}-\$\{idx\}`}}?/g, 'key={`new-assignment-${$1}-${$2}`}');
    content = content.replace(/key={{?`assignment-\$\{([^}]+)\}-\$\{([^}]+)\}-\$\{idx\}`}}?/g, 'key={`assignment-${$1}-${$2}`}');
    content = content.replace(/key={{?`edit-assignment-\$\{([^}]+)\}-\$\{([^}]+)\}-\$\{idx\}`}}?/g, 'key={`edit-assignment-${$1}-${$2}`}');
    
    // Lesson / Material
    content = content.replace(/key={{?`lesson-\$\{([^}]+)\}-\$\{index\}`}}?/g, 'key={`lesson-${$1}`}');
    content = content.replace(/key={{?`lesson-\$\{([^}]+)\}-\$\{idx\}`}}?/g, 'key={`lesson-${$1}`}');
    content = content.replace(/key={{?`material-\$\{([^}]+)\}-\$\{index\}`}}?/g, 'key={`material-${$1}`}');
    content = content.replace(/key={{?`archive-lesson-\$\{([^}]+)\}-\$\{idx\}`}}?/g, 'key={`archive-lesson-${$1}`}');
    
    // Attachments
    content = content.replace(/key={{?`attachment-\$\{([^}]+)\}-\$\{idx\}`}}?/g, 'key={`attachment-${$1 || idx}`}');
    content = content.replace(/key={{?`att-\$\{([^}]+)\}-\$\{idx\}`}}?/g, 'key={`att-${$1 || idx}`}');
    content = content.replace(/key={{?`att-file-\$\{([^}]+)\}-\$\{idx\}`}}?/g, 'key={`att-file-${$1 || idx}`}');
    content = content.replace(/key={{?`sub-file-\$\{([^}]+)\}-\$\{i\}`}}?/g, 'key={`sub-file-${$1 || i}`}');
    content = content.replace(/key={{?`preview-att-\$\{([^}]+)\}-\$\{idx\}`}}?/g, 'key={`preview-att-${$1 || idx}`}');
    content = content.replace(/key={{?`new-lesson-att-\$\{([^}]+)\}-\$\{i\}`}}?/g, 'key={`new-lesson-att-${$1 || i}`}');
    content = content.replace(/key={{?`new-proj-att-\$\{([^}]+)\}-\$\{idx\}`}}?/g, 'key={`new-proj-att-${$1 || idx}`}');
    content = content.replace(/key={{?`post-att-\$\{([^}]+)\}-\$\{([^}]+)\}-\$\{i\}`}}?/g, 'key={`post-att-${$1}-${$2}`}');
    content = content.replace(/key={{?`msg-att-\$\{([^}]+)\}-\$\{idx\}`}}?/g, 'key={`msg-att-${$1 || idx}`}');
    
    // Comments
    content = content.replace(/key={{?`material-comment-\$\{([^}]+)\}-\$\{index\}`}}?/g, 'key={`material-comment-${$1}`}');
    content = content.replace(/key={{?`comment-\$\{([^}]+)\}-\$\{index\}`}}?/g, 'key={`comment-${$1}`}');
    content = content.replace(/key={{?`lesson-comment-\$\{([^}]+)\}-\$\{idx\}`}}?/g, 'key={`lesson-comment-${$1}`}');
    
    // Posts / Archive Posts
    content = content.replace(/key={{?`post-\$\{([^}]+)\}-\$\{index\}`}}?/g, 'key={`post-${$1}`}');
    content = content.replace(/key={{?`archive-post-\$\{([^}]+)\}-\$\{idx\}`}}?/g, 'key={`archive-post-${$1}`}');
    
    // Projects
    content = content.replace(/key={{?`project-\$\{([^}]+)\}-\$\{index\}`}}?/g, 'key={`project-${$1}`}');
    content = content.replace(/key={{?`archive-project-\$\{([^}]+)\}-\$\{idx\}`}}?/g, 'key={`archive-project-${$1}`}');
    content = content.replace(/key={{?`proj-teacher-\$\{([^}]+)\}-\$\{([^}]+)\}-\$\{idx\}`}}?/g, 'key={`proj-teacher-${$1}-${$2}`}');
    content = content.replace(/key={{?`view-proj-teacher-\$\{([^}]+)\}-\$\{([^}]+)\}-\$\{idx\}`}}?/g, 'key={`view-proj-teacher-${$1}-${$2}`}');
    content = content.replace(/key={{?`proj-task-\$\{([^}]+)\}-\$\{([^}]+)\}-\$\{i\}`}}?/g, 'key={`proj-task-${$1}-${$2}`}');
    content = content.replace(/key={{?`new-proj-task-\$\{([^}]+)\}-\$\{idx\}`}}?/g, 'key={`new-proj-task-${$1}`}');
    
    // Msgs / Notifs
    content = content.replace(/key={{?`msg-\$\{([^}]+)\}-\$\{index\}`}}?/g, 'key={`msg-${$1}`}');
    
    // Others
    content = content.replace(/key={{?`supervisor-\$\{([^}]+)\}-\$\{idx\}`}}?/g, 'key={`supervisor-${$1}`}');
    content = content.replace(/key={{?`\$\{supervisor\.id\}-\$\{s\}-\$\{index\}`}}?/g, 'key={`${supervisor.id}-${s}`}');
    content = content.replace(/key={{?`teacher-select-\$\{([^}]+)\}-\$\{idx\}`}}?/g, 'key={`teacher-select-${$1}`}');
    content = content.replace(/key={{?`subject-filter-\$\{([^}]+)\}-\$\{idx\}`}}?/g, 'key={`subject-filter-${$1}`}');
    content = content.replace(/key={{?`teacher-avatar-\$\{([^}]+)\}-\$\{([^}]+)\}-\$\{([^}]+)\}-\$\{i\}`}}?/g, 'key={`teacher-avatar-${$1}-${$2}-${$3}`}');
    
    // Sidebar
    content = content.replace(/key={{?`sidebar-\$\{([^}]+)\}-\$\{idx\}`}}?/g, 'key={`sidebar-${$1}`}');
    
    content = content.replace(/key={{?`archive-year-\$\{([^}]+)\}-\$\{idx\}`}}?/g, 'key={`archive-year-${$1}`}');
    content = content.replace(/key={{?`archive-sem-\$\{([^}]+)\}`}}?/g, 'key={`archive-sem-${$1}`}');

    fs.writeFileSync(file, content, 'utf-8');
});
