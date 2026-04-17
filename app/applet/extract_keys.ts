import * as fs from 'fs';

const content = fs.readFileSync('components/SupervisorDashboard.tsx', 'utf-8');
const lines = content.split('\n');

lines.forEach((line, i) => {
    if (line.includes('key={') || line.includes('key=')) {
        const match = line.match(/key=({[^}]*}|"[^"]*"|'[^']*')/);
        if (match) {
            console.log(`Line ${i + 1}: ${match[1]}`);
        }
    }
});
