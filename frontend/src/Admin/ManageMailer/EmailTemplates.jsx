import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const EmailTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState({
    name: '',
    subject: '',
    content: '',
    emailBackground: '#f4f4f4',
    styles: {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#333333',
      backgroundColor: '#ffffff',
      textAlign: 'left'
    }
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showEmailBgPicker, setShowEmailBgPicker] = useState(false);
  const [showComponentPanel, setShowComponentPanel] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [editMode, setEditMode] = useState('create');
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  // Available placeholders
  const placeholders = [
    { label: 'Customer Name', value: '{{customerName}}' },
    { label: 'Order ID', value: '{{orderId}}' },
    { label: 'Order Total', value: '{{orderTotal}}' },
    { label: 'Product Name', value: '{{productName}}' },
    { label: 'Shipping Address', value: '{{shippingAddress}}' },
    { label: 'Tracking Number', value: '{{trackingNumber}}' },
    { label: 'Date', value: '{{date}}' },
    { label: 'Company Name', value: '{{companyName}}' }
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get('/mail/templates');
      setTemplates(response.data);
    } catch (error) {
      console.log('No templates yet or error fetching:', error.message);
    }
  };

  const handleStyleChange = (property, value) => {
    setCurrentTemplate(prev => ({
      ...prev,
      styles: { ...prev.styles, [property]: value }
    }));
  };

  const applyFormatting = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  // Insert button
  const insertButton = () => {
    const buttonText = prompt('Button text:', 'Shop Now');
    const buttonLink = prompt('Button link (URL):', 'https://');
    const buttonColor = prompt('Button color (hex):', '#007bff');
    
    if (buttonText && buttonLink) {
      const buttonHTML = `
        <table cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
          <tr>
            <td style="border-radius: 5px; background-color: ${buttonColor}; padding: 0;">
              <a href="${buttonLink}" target="_blank" style="display: inline-block; padding: 12px 30px; font-family: Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
                ${buttonText}
              </a>
            </td>
          </tr>
        </table>
      `;
      document.execCommand('insertHTML', false, buttonHTML);
    }
  };

  // Insert image
  const insertImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post('/mail/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const imageUrl = response.data.imageUrl;
      const imageHTML = `<img src="${imageUrl}" style="max-width: 100%; height: auto; display: block; margin: 10px 0;" alt="Email image" />`;
      document.execCommand('insertHTML', false, imageHTML);
    } catch (error) {
      // Fallback: use base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageHTML = `<img src="${e.target.result}" style="max-width: 100%; height: auto; display: block; margin: 10px 0;" alt="Email image" />`;
        document.execCommand('insertHTML', false, imageHTML);
      };
      reader.readAsDataURL(file);
    }
  };

  // Insert link
  const insertLink = () => {
    const url = prompt('Enter URL:', 'https://');
    const text = prompt('Link text:', 'Click here');
    
    if (url && text) {
      const linkHTML = `<a href="${url}" target="_blank" style="color: #007bff; text-decoration: underline;">${text}</a>`;
      document.execCommand('insertHTML', false, linkHTML);
    }
  };

  // Insert divider
  const insertDivider = () => {
    const dividerHTML = `<hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />`;
    document.execCommand('insertHTML', false, dividerHTML);
  };

  // Insert spacer
  const insertSpacer = () => {
    const spacerHTML = `<div style="height: 30px;"></div>`;
    document.execCommand('insertHTML', false, spacerHTML);
  };

  // Insert 2 column layout
  const insertTwoColumn = () => {
    const twoColHTML = `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0;">
        <tr>
          <td width="48%" valign="top" style="padding: 10px;">
            <p>Left column content here...</p>
          </td>
          <td width="4%"></td>
          <td width="48%" valign="top" style="padding: 10px;">
            <p>Right column content here...</p>
          </td>
        </tr>
      </table>
    `;
    document.execCommand('insertHTML', false, twoColHTML);
  };

  // Insert 3 column layout
  const insertThreeColumn = () => {
    const threeColHTML = `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0;">
        <tr>
          <td width="31%" valign="top" style="padding: 10px;">
            <p>Column 1 content...</p>
          </td>
          <td width="3%"></td>
          <td width="31%" valign="top" style="padding: 10px;">
            <p>Column 2 content...</p>
          </td>
          <td width="3%"></td>
          <td width="31%" valign="top" style="padding: 10px;">
            <p>Column 3 content...</p>
          </td>
        </tr>
      </table>
    `;
    document.execCommand('insertHTML', false, threeColHTML);
  };

  // Insert placeholder
  const insertPlaceholder = (placeholder) => {
    const placeholderHTML = `<span style="background-color: #ffffcc; padding: 2px 6px; border-radius: 3px; font-weight: bold; color: #666;">${placeholder}</span>`;
    document.execCommand('insertHTML', false, placeholderHTML);
  };

  // Insert header section
  const insertHeader = () => {
    const headerHTML = `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #007bff; padding: 20px; margin-bottom: 20px;">
        <tr>
          <td align="center">
            <h1 style="color: #ffffff; margin: 0; font-family: Arial, sans-serif; font-size: 28px;">TechHive</h1>
          </td>
        </tr>
      </table>
    `;
    document.execCommand('insertHTML', false, headerHTML);
  };

  // Insert footer section
  const insertFooter = () => {
    const footerHTML = `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f8f8; padding: 20px; margin-top: 20px; border-top: 1px solid #ddd;">
        <tr>
          <td align="center">
            <p style="color: #666; font-size: 12px; margin: 5px 0;">© 2025 TechHive. All rights reserved.</p>
            <p style="color: #666; font-size: 12px; margin: 5px 0;">
              <a href="#" style="color: #007bff; text-decoration: none; margin: 0 10px;">Unsubscribe</a> | 
              <a href="#" style="color: #007bff; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
            </p>
          </td>
        </tr>
      </table>
    `;
    document.execCommand('insertHTML', false, footerHTML);
  };

  // Insert product card
  const insertProductCard = () => {
    const productHTML = `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <tr>
          <td width="200" valign="top">
            <img src="https://via.placeholder.com/200" style="width: 200px; height: 200px; object-fit: cover; display: block;" alt="Product" />
          </td>
          <td valign="top" style="padding: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #333; font-size: 20px;">Product Name</h3>
            <p style="color: #666; margin: 0 0 10px 0; line-height: 1.6;">Product description goes here. This is a great product that you'll love.</p>
            <p style="font-size: 24px; font-weight: bold; color: #007bff; margin: 10px 0;">$99.99</p>
            <a href="#" style="display: inline-block; padding: 10px 25px; background-color: #28a745; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Buy Now</a>
          </td>
        </tr>
      </table>
    `;
    document.execCommand('insertHTML', false, productHTML);
  };

  const handleSave = async () => {
    if (!currentTemplate.name || !currentTemplate.subject || !currentTemplate.content) {
      setStatus({ type: 'error', message: 'Please fill in all fields' });
      return;
    }

    try {
      if (editMode === 'edit' && currentTemplate._id) {
        await axios.put(`/mail/templates/${currentTemplate._id}`, currentTemplate);
        setStatus({ type: 'success', message: 'Template updated successfully!' });
      } else {
        await axios.post('/mail/templates', currentTemplate);
        setStatus({ type: 'success', message: 'Template saved successfully!' });
      }
      fetchTemplates();
      resetTemplate();
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to save template' });
    }
  };

  const loadTemplate = (template) => {
    setCurrentTemplate(template);
    setEditMode('edit');
    if (editorRef.current) {
      editorRef.current.innerHTML = template.content;
    }
  };

  const deleteTemplate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await axios.delete(`/mail/templates/${id}`);
      setStatus({ type: 'success', message: 'Template deleted' });
      fetchTemplates();
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to delete template' });
    }
  };

  const resetTemplate = () => {
    setCurrentTemplate({
      name: '',
      subject: '',
      content: '',
      emailBackground: '#f4f4f4',
      styles: {
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        color: '#333333',
        backgroundColor: '#ffffff',
        textAlign: 'left'
      }
    });
    setEditMode('create');
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
  };

  const handleContentChange = () => {
    setCurrentTemplate(prev => ({
      ...prev,
      content: editorRef.current.innerHTML
    }));
  };

  const renderPreview = () => {
    return (
      <div style={{
        backgroundColor: currentTemplate.emailBackground,
        padding: '40px 20px',
        minHeight: '500px'
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          backgroundColor: currentTemplate.styles.backgroundColor,
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          fontFamily: currentTemplate.styles.fontFamily,
          fontSize: currentTemplate.styles.fontSize,
          color: currentTemplate.styles.color
        }}>
          <div dangerouslySetInnerHTML={{ __html: currentTemplate.content }} />
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, color: '#333' }}>Professional Email Template Builder</h1>
        <button
          onClick={() => setPreviewMode(!previewMode)}
          style={{
            padding: '10px 20px',
            backgroundColor: previewMode ? '#28a745' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {previewMode ? '📝 Edit Mode' : '👁️ Preview Mode'}
        </button>
      </div>

      {status.message && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          borderRadius: '4px',
          backgroundColor: status.type === 'success' ? '#d4edda' : '#f8d7da',
          color: status.type === 'success' ? '#155724' : '#721c24',
          border: `1px solid ${status.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {status.message}
        </div>
      )}

      {previewMode ? (
        renderPreview()
      ) : (
        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Component Panel */}
          {showComponentPanel && (
            <div style={{ 
              width: '280px', 
              backgroundColor: '#fff', 
              padding: '20px', 
              borderRadius: '8px', 
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              height: 'fit-content',
              position: 'sticky',
              top: '20px'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '18px' }}>Components</h3>
              
              {/* Layout Components */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>📐 Layouts</h4>
                <ComponentButton onClick={insertTwoColumn}>2 Columns</ComponentButton>
                <ComponentButton onClick={insertThreeColumn}>3 Columns</ComponentButton>
                <ComponentButton onClick={insertDivider}>Divider</ComponentButton>
                <ComponentButton onClick={insertSpacer}>Spacer</ComponentButton>
              </div>

              {/* Content Components */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>📝 Content</h4>
                <ComponentButton onClick={insertButton}>Button</ComponentButton>
                <ComponentButton onClick={insertImage}>Image</ComponentButton>
                <ComponentButton onClick={insertLink}>Link</ComponentButton>
                <ComponentButton onClick={insertProductCard}>Product Card</ComponentButton>
              </div>

              {/* Sections */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>📋 Sections</h4>
                <ComponentButton onClick={insertHeader}>Header</ComponentButton>
                <ComponentButton onClick={insertFooter}>Footer</ComponentButton>
              </div>

              {/* Placeholders */}
              <div>
                <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>🏷️ Placeholders</h4>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      insertPlaceholder(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '12px',
                    marginBottom: '5px'
                  }}
                >
                  <option value="">Insert Placeholder...</option>
                  {placeholders.map((p, i) => (
                    <option key={i} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Editor Section */}
          <div style={{ flex: '1', backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '22px' }}>
              {editMode === 'create' ? 'Create New Template' : 'Edit Template'}
            </h2>

            {/* Template Name & Subject */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                  Template Name:
                </label>
                <input
                  type="text"
                  value={currentTemplate.name}
                  onChange={(e) => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
                  placeholder="e.g., Welcome Email"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                  Subject Line:
                </label>
                <input
                  type="text"
                  value={currentTemplate.subject}
                  onChange={(e) => setCurrentTemplate({ ...currentTemplate, subject: e.target.value })}
                  placeholder="Email subject"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Email Background Color */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                Email Background Color:
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={currentTemplate.emailBackground}
                  onChange={(e) => setCurrentTemplate({ ...currentTemplate, emailBackground: e.target.value })}
                  style={{ width: '50px', height: '35px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={currentTemplate.emailBackground}
                  onChange={(e) => setCurrentTemplate({ ...currentTemplate, emailBackground: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="#f4f4f4"
                />
              </div>
            </div>

            {/* Formatting Toolbar */}
            <div style={toolbarStyle}>
              {/* Text Formatting */}
              <ToolbarButton onClick={() => applyFormatting('bold')} title="Bold"><strong>B</strong></ToolbarButton>
              <ToolbarButton onClick={() => applyFormatting('italic')} title="Italic"><em>I</em></ToolbarButton>
              <ToolbarButton onClick={() => applyFormatting('underline')} title="Underline"><u>U</u></ToolbarButton>
              <ToolbarButton onClick={() => applyFormatting('strikeThrough')} title="Strikethrough"><s>S</s></ToolbarButton>
              
              <div style={dividerStyle}></div>

              {/* Heading */}
              <select onChange={(e) => { applyFormatting('formatBlock', e.target.value); e.target.value = ''; }} style={selectStyle}>
                <option value="">Heading</option>
                <option value="h1">H1</option>
                <option value="h2">H2</option>
                <option value="h3">H3</option>
                <option value="p">Normal</option>
              </select>

              <div style={dividerStyle}></div>

              {/* Alignment */}
              <ToolbarButton onClick={() => applyFormatting('justifyLeft')} title="Align Left">⬅</ToolbarButton>
              <ToolbarButton onClick={() => applyFormatting('justifyCenter')} title="Align Center">↔</ToolbarButton>
              <ToolbarButton onClick={() => applyFormatting('justifyRight')} title="Align Right">➡</ToolbarButton>

              <div style={dividerStyle}></div>

              {/* Lists */}
              <ToolbarButton onClick={() => applyFormatting('insertUnorderedList')} title="Bullet List">• List</ToolbarButton>
              <ToolbarButton onClick={() => applyFormatting('insertOrderedList')} title="Numbered List">1. List</ToolbarButton>

              <div style={dividerStyle}></div>

              {/* Font Size */}
              <select
                onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                value={currentTemplate.styles.fontSize}
                style={selectStyle}
              >
                <option value="12px">12px</option>
                <option value="14px">14px</option>
                <option value="16px">16px</option>
                <option value="18px">18px</option>
                <option value="20px">20px</option>
                <option value="24px">24px</option>
                <option value="28px">28px</option>
                <option value="32px">32px</option>
              </select>

              {/* Font Family */}
              <select
                onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                value={currentTemplate.styles.fontFamily}
                style={selectStyle}
              >
                <option value="Arial, sans-serif">Arial</option>
                <option value="'Times New Roman', serif">Times New Roman</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="'Courier New', monospace">Courier</option>
                <option value="Verdana, sans-serif">Verdana</option>
                <option value="'Trebuchet MS', sans-serif">Trebuchet</option>
                <option value="'Helvetica Neue', sans-serif">Helvetica</option>
              </select>

              <div style={dividerStyle}></div>

              {/* Colors */}
              <div style={{ position: 'relative' }}>
                <ToolbarButton onClick={() => setShowColorPicker(!showColorPicker)} title="Text Color">
                  A <div style={{ width: '20px', height: '4px', backgroundColor: currentTemplate.styles.color, marginTop: '2px' }}></div>
                </ToolbarButton>
                {showColorPicker && (
                  <ColorPickerPopup 
                    value={currentTemplate.styles.color}
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    onClose={() => setShowColorPicker(false)}
                  />
                )}
              </div>

              <div style={{ position: 'relative' }}>
                <ToolbarButton onClick={() => setShowBgColorPicker(!showBgColorPicker)} title="Content Background">
                  🎨 <div style={{ width: '20px', height: '4px', backgroundColor: currentTemplate.styles.backgroundColor, marginTop: '2px' }}></div>
                </ToolbarButton>
                {showBgColorPicker && (
                  <ColorPickerPopup 
                    value={currentTemplate.styles.backgroundColor}
                    onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                    onClose={() => setShowBgColorPicker(false)}
                  />
                )}
              </div>
            </div>

            {/* Content Editor */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                Email Content:
              </label>
              <div
                ref={editorRef}
                contentEditable
                onInput={handleContentChange}
                style={{
                  minHeight: '400px',
                  padding: '20px',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  fontSize: currentTemplate.styles.fontSize,
                  fontFamily: currentTemplate.styles.fontFamily,
                  color: currentTemplate.styles.color,
                  backgroundColor: currentTemplate.styles.backgroundColor,
                  textAlign: currentTemplate.styles.textAlign,
                  outline: 'none',
                  lineHeight: '1.6'
                }}
                placeholder="Start typing or use components from the left panel..."
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleSave} style={primaryButtonStyle}>
                  {editMode === 'create' ? '💾 Save Template' : '✏️ Update Template'}
                </button>
                {editMode === 'edit' && (
                  <button onClick={resetTemplate} style={secondaryButtonStyle}>
                    ➕ New Template
                  </button>
                )}
              </div>
              <button 
                onClick={() => setShowComponentPanel(!showComponentPanel)} 
                style={secondaryButtonStyle}
              >
                {showComponentPanel ? '⬅ Hide Panel' : '➡ Show Panel'}
              </button>
            </div>
          </div>

          {/* Templates List Section */}
          <div style={{ 
            width: '320px', 
            backgroundColor: '#fff', 
            padding: '20px', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            height: 'fit-content',
            position: 'sticky',
            top: '20px',
            maxHeight: 'calc(100vh - 40px)',
            overflowY: 'auto'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px' }}>Saved Templates ({templates.length})</h2>
            
            {templates.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', padding: '30px 20px', fontSize: '14px' }}>
                📧 No templates yet. Create your first one!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {templates.map((template) => (
                  <div
                    key={template._id}
                    style={{
                      padding: '15px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: currentTemplate._id === template._id ? '#e7f3ff' : 'white',
                      boxShadow: currentTemplate._id === template._id ? '0 2px 6px rgba(0,123,255,0.2)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#007bff';
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,123,255,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e0e0e0';
                      if (currentTemplate._id !== template._id) {
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#333', fontWeight: '600' }}>
                      {template.name}
                    </h3>
                    <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {template.subject}
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => loadTemplate(template)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: '500',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => deleteTemplate(template._id)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: '500',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden file input for image upload */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleImageUpload}
      />
    </div>
  );
};

// Helper Components
const ComponentButton = ({ onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%',
      padding: '10px',
      marginBottom: '8px',
      border: '1px solid #ddd',
      backgroundColor: 'white',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '13px',
      textAlign: 'left',
      transition: 'all 0.2s',
      fontWeight: '500'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = '#007bff';
      e.currentTarget.style.color = 'white';
      e.currentTarget.style.borderColor = '#007bff';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'white';
      e.currentTarget.style.color = 'black';
      e.currentTarget.style.borderColor = '#ddd';
    }}
  >
    {children}
  </button>
);

const ToolbarButton = ({ onClick, title, children }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      padding: '8px 12px',
      border: '1px solid #ddd',
      backgroundColor: 'white',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontWeight: '500'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = '#f0f0f0';
      e.currentTarget.style.borderColor = '#999';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'white';
      e.currentTarget.style.borderColor = '#ddd';
    }}
  >
    {children}
  </button>
);

const ColorPickerPopup = ({ value, onChange, onClose }) => (
  <div style={{
    position: 'absolute',
    top: '100%',
    left: 0,
    zIndex: 1000,
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    marginTop: '5px',
    border: '1px solid #ddd'
  }}>
    <input
      type="color"
      value={value}
      onChange={onChange}
      style={{ width: '100px', height: '50px', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
    />
    <input
      type="text"
      value={value}
      onChange={onChange}
      style={{ 
        width: '100%', 
        marginTop: '10px', 
        padding: '6px', 
        border: '1px solid #ddd', 
        borderRadius: '4px',
        fontSize: '12px'
      }}
    />
    <button 
      onClick={onClose} 
      style={{ 
        marginTop: '10px', 
        padding: '6px 15px', 
        fontSize: '12px',
        width: '100%',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      Close
    </button>
  </div>
);

// Styles
const inputStyle = {
  width: '100%',
  padding: '10px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '14px'
};

const toolbarStyle = {
  marginBottom: '15px',
  padding: '12px',
  backgroundColor: '#f8f9fa',
  borderRadius: '6px',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  alignItems: 'center'
};

const selectStyle = {
  padding: '8px 10px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '13px',
  cursor: 'pointer',
  backgroundColor: 'white'
};

const dividerStyle = {
  width: '1px',
  height: '24px',
  backgroundColor: '#ddd',
  margin: '0 4px'
};

const primaryButtonStyle = {
  padding: '12px 30px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  fontSize: '14px',
  cursor: 'pointer',
  fontWeight: '600',
  transition: 'background-color 0.2s'
};

const secondaryButtonStyle = {
  padding: '12px 30px',
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  fontSize: '14px',
  cursor: 'pointer',
  fontWeight: '600',
  transition: 'background-color 0.2s'
};

export default EmailTemplates;
