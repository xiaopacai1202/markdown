import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// 添加中文支持
const addChineseFontSupport = (pdf) => {
  // 使用支持中文的字体
  pdf.setFont('helvetica','normal');
  return pdf;
};

// 格式化日期函数
const formatDateForPDF = (date) => {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * 将 HTML 元素导出为 PDF
 * @param {HTMLElement} element - 要导出的 DOM 元素
 * @param {string} filename - 导出文件名
 * @param {Object} options - 配置选项
 */
export const exportToPDF = async (element, filename = 'document.pdf', options = {}) => {
  try {
    // 显示加载状态
    if (options.onStart) options.onStart();
    
    // 获取元素的实际尺寸
    const originalWidth = element.scrollWidth;
    
    // 创建副本以避免影响原始显示
    const clone = element.cloneNode(true);
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.width = `${originalWidth}px`;
    clone.style.height = 'auto';
    clone.style.overflow = 'visible';
    
    // 确保中文字体在克隆的元素中正确显示
    clone.style.fontFamily = "'Noto Sans SC', 'Microsoft YaHei', sans-serif";
    document.body.appendChild(clone);

    // 等待渲染完成
    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(clone, {
      scale: 2, // 提高分辨率
      logging: false,
      useCORS: true,
      backgroundColor: options.backgroundColor || '#ffffff',
      onclone: (clonedDoc) => {
        // 确保克隆的元素样式正确
        const clonedElement = clonedDoc.querySelector('.html-preview');
        if (clonedElement) {
          clonedElement.style.width = `${originalWidth}px`;
          clonedElement.style.padding = '2cm';
          clonedElement.style.boxSizing = 'border-box';
          // 确保中文字体
          clonedElement.style.fontFamily = "'Noto Sans SC', 'Microsoft YaHei', sans-serif";
          
          // 添加标题和生成时间到预览内容中
          if (options.title || options.date) {
            const headerDiv = document.createElement('div');
            headerDiv.style.marginBottom = '20px';
            headerDiv.style.borderBottom = '2px solid #ccc';
            headerDiv.style.paddingBottom = '10px';
            headerDiv.style.textAlign = 'center';
            
            if (options.title) {
              const titleEl = document.createElement('h1');
              titleEl.textContent = options.title;
              titleEl.style.margin = '0 0 10px 0';
              titleEl.style.fontSize = '24px';
              headerDiv.appendChild(titleEl);
            }
            
            if (options.date) {
              const dateEl = document.createElement('div');
              dateEl.textContent = `生成时间: ${options.date}`;
              dateEl.style.fontSize = '14px';
              dateEl.style.color = '#666';
              headerDiv.appendChild(dateEl);
            }
            
            clonedElement.insertBefore(headerDiv, clonedElement.firstChild);
          }
        }
      }
    });

    // 清理克隆元素
    document.body.removeChild(clone);

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // 添加中文支持
    addChineseFontSupport(pdf);

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // 计算图片在 PDF 中的尺寸 - 修正图片大小问题
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // 计算比例，确保图片适应页面
    const ratio = Math.min(
      (pdfWidth - 40) / imgWidth,  // 左右留白20mm
      (pdfHeight - 60) / imgHeight // 上下留白30mm
    );
    
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 30; // 顶部留白

    // 添加图片到 PDF - 分页处理
    let currentHeight = imgY;
    let remainingHeight = imgHeight * ratio;
    let pageNum = 1;
    
    while (remainingHeight > 0) {
      // 计算当前页可以容纳的高度
      const pageSpace = pdfHeight - currentHeight - 15; // 底部留15mm给页脚
      
      if (pageSpace < 0) {
        pdf.addPage();
        currentHeight = 30; // 新页面的顶部留白
        pageNum++;
        continue;
      }
      
      // 计算当前页要显示的图片高度
      const displayHeight = Math.min(remainingHeight, pageSpace);
      
      
      
      // 添加图片片段到当前页
      pdf.addImage(
        imgData,
        'PNG',
        imgX,
        currentHeight,
        imgWidth * ratio,
        displayHeight,
        undefined,
        'FAST',
        0
      );
      
      // 更新位置
      currentHeight += displayHeight;
      remainingHeight -= displayHeight;
      
      // 如果还有剩余高度，添加新页面
      if (remainingHeight > 0) {
        pdf.addPage();
        currentHeight = 30;
        pageNum=pageNum+1;
      }
    }

    // 添加页脚 - 使用图片方式避免乱码
    const totalPages = pdf.internal.getNumberOfPages();
    
    // 创建页脚画布
    const footerCanvas = document.createElement('canvas');
    footerCanvas.width = 200;
    footerCanvas.height = 20;
    const footerCtx = footerCanvas.getContext('2d');
    
    // 设置页脚样式
    footerCtx.fillStyle = '#666';
    footerCtx.font = '12px Arial';
    footerCtx.textAlign = 'center';
    
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      
      // 清除画布
      footerCtx.clearRect(0, 0, footerCanvas.width, footerCanvas.height);
      
      // 绘制页脚文本
      footerCtx.fillText(`第 ${i} 页 / 共 ${totalPages} 页`, footerCanvas.width / 2, 15);
      
      // 将画布转换为图片
      const footerImgData = footerCanvas.toDataURL('image/png');
      
      // 添加页脚图片到PDF
      pdf.addImage(
        footerImgData,
        'PNG',
        (pdfWidth - footerCanvas.width / 3) / 2, // 居中
        pdfHeight - 15, // 底部位置
        footerCanvas.width / 3, // 缩放
        footerCanvas.height / 3 // 缩放
      );
    }

    // 保存 PDF
    pdf.save(filename);
    
    if (options.onSuccess) options.onSuccess();
    return true;

  } catch (error) {
    console.error('PDF export error:', error);
    if (options.onError) options.onError(error);
    return false;
  }
};

/**
 * 导出 Markdown 内容为 PDF（纯文本版本）
 * @param {string} content - Markdown 内容
 * @param {string} title - 文档标题
 * @param {string} filename - 导出文件名
 */
export const exportMarkdownAsPDF = (content, title = '文档', filename = 'document.pdf') => {
  const pdf = new jsPDF();
  
  // 添加中文支持
  addChineseFontSupport(pdf);
  
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  
  // 创建页脚画布
  const footerCanvas = document.createElement('canvas');
  footerCanvas.width = 200;
  footerCanvas.height = 20;
  const footerCtx = footerCanvas.getContext('2d');
  
  // 设置页脚样式
  footerCtx.fillStyle = '#666';
  footerCtx.font = '12px Arial';
  footerCtx.textAlign = 'center';
  
  // 设置字体和样式
  pdf.setFontSize(16);
  pdf.setFont(undefined, 'bold');
  
  // 添加标题
  pdf.text(title, pdfWidth / 2, 20, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setFont(undefined, 'normal');
  
  // 添加生成时间
  const now = new Date();
  pdf.text(`生成时间: ${formatDateForPDF(now)}`, pdfWidth / 2, 30, { align: 'center' });
  
  // 添加内容 - 使用分页文本
  const lines = pdf.splitTextToSize(content, pdfWidth - 40); // 左右留白20mm
  
  let y = 45;
  let page = 1;
  const lineHeight = 7;
  
  for (let i = 0; i < lines.length; i++) {
    if (y > pdfHeight - 20) {
      pdf.addPage();
      page=page+1;
      y = 20;
      
      // 添加页眉到新页面
      pdf.setFontSize(10);
      pdf.text(title, 20, 10);
    }
    
    pdf.text(lines[i], 20, y);
    y += lineHeight;
  }
  
  // 添加页码 - 使用图片方式避免乱码
  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    
    // 清除画布
    footerCtx.clearRect(0, 0, footerCanvas.width, footerCanvas.height);
    
    // 绘制页脚文本
    footerCtx.fillText(`第 ${i} 页 / 共 ${totalPages} 页`, footerCanvas.width / 2, 15);
    
    // 将画布转换为图片
    const footerImgData = footerCanvas.toDataURL('image/png');
    
    // 添加页脚图片到PDF
    pdf.addImage(
      footerImgData,
      'PNG',
      (pdfWidth - footerCanvas.width / 3) / 2, // 居中
      pdfHeight - 15, // 底部位置
      footerCanvas.width / 3, // 缩放
      footerCanvas.height / 3 // 缩放
    );
  }
  
  // 保存
  pdf.save(filename);
  return true;
};