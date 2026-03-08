
import { Project, LessonMaterial, User } from '../../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(fieldName => {
        const value = row[fieldName] === null || row[fieldName] === undefined ? '' : row[fieldName];
        // Escape quotes and handle commas
        const escaped = ('' + value).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    )
  ].join('\n');

  // Add BOM for Excel Arabic support
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Strip the data URL prefix to get just the base64 string
    const base64Image = imgData.split(',')[1];
    
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(base64Image, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert('حدث خطأ أثناء تصدير ملف PDF');
  }
};

export const exportTeachersCSV = (teachers: User[]) => {
  const data = teachers.map(t => ({
    'الاسم': t.name,
    'الرقم الوظيفي': t.code,
    'المادة': t.subject || 'غير محدد',
    'الصفوف': t.teachingGrades || '-',
    'رقم الهاتف': t.phoneNumber || '-',
    'تاريخ الانضمام': t.joinedAt,
    'الحالة': t.isActive ? 'نشط' : 'غير نشط'
  }));
  exportToCSV(data, 'سجل_المعلمات');
};

export const exportLessonsCSV = (lessons: LessonMaterial[]) => {
  const data = lessons.map(l => ({
    'عنوان الدرس': l.lessonTitle,
    'المعلمة': l.teacherName,
    'التاريخ': l.createdAt,
    'نموذجي': l.isModelLesson ? 'نعم' : 'لا',
    'الوصف': l.description
  }));
  exportToCSV(data, 'سجل_الدروس_الاشرافية');
};

export const exportProjectsCSV = (projects: Project[]) => {
  const data = projects.map(p => ({
    'اسم المشروع': p.name,
    'الوصف': p.description,
    'عدد المعلمات المكلفات': p.assignedTeacherIds.length,
    'تاريخ البداية': p.startDate || '-',
    'تاريخ النهاية': p.endDate || '-',
    'تاريخ الإنشاء': p.createdAt,
    'السنة الدراسية': p.academicYear
  }));
  exportToCSV(data, 'سجل_المشاريع');
};
