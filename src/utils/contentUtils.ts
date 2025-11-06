// Content Type Management Utilities
import type { MockNote, MindMapNode } from '../lib/mockStorage';

// Mind map utilities
export const mindMapUtils = {
  // Create a new mind map node
  createNode: (topic: string, parent?: string): MindMapNode => ({
    id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    topic,
    children: [],
    parent,
    x: 0,
    y: 0,
    color: undefined,
    style: undefined
  }),

  // Add child node to parent
  addChild: (mindMap: MindMapNode, parentId: string, childTopic: string): MindMapNode => {
    const findAndAddChild = (node: MindMapNode): MindMapNode => {
      if (node.id === parentId) {
        return {
          ...node,
          children: [...node.children, mindMapUtils.createNode(childTopic, parentId)]
        };
      }
      return {
        ...node,
        children: node.children.map(child => findAndAddChild(child))
      };
    };
    return findAndAddChild(mindMap);
  },

  // Remove node from mind map
  removeNode: (mindMap: MindMapNode, nodeId: string): MindMapNode => {
    const removeRecursive = (node: MindMapNode): MindMapNode => ({
      ...node,
      children: node.children
        .filter(child => child.id !== nodeId)
        .map(child => removeRecursive(child))
    });
    return removeRecursive(mindMap);
  },

  // Update node topic
  updateNode: (mindMap: MindMapNode, nodeId: string, newTopic: string): MindMapNode => {
    const updateRecursive = (node: MindMapNode): MindMapNode => {
      if (node.id === nodeId) {
        return { ...node, topic: newTopic };
      }
      return {
        ...node,
        children: node.children.map(child => updateRecursive(child))
      };
    };
    return updateRecursive(mindMap);
  },

  // Convert mind map to JSON string
  toJSON: (mindMap: MindMapNode): string => {
    return JSON.stringify(mindMap, null, 2);
  },

  // Create mind map from JSON
  fromJSON: (jsonString: string): MindMapNode | null => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && parsed.topic && Array.isArray(parsed.children)) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  },

  // Get all nodes as flat array
  getAllNodes: (mindMap: MindMapNode): MindMapNode[] => {
    const nodes: MindMapNode[] = [];
    const traverse = (node: MindMapNode) => {
      nodes.push(node);
      node.children.forEach(traverse);
    };
    traverse(mindMap);
    return nodes;
  },

  // Get node count
  getNodeCount: (mindMap: MindMapNode): number => {
    return mindMapUtils.getAllNodes(mindMap).length;
  },

  // Convert mind map to plain text
  mindMapToPlainText: (mindMap: MindMapNode): string => {
    const formatNode = (node: MindMapNode, level: number = 0): string => {
      const indent = '  '.repeat(level);
      const text = `${indent}${node.topic}`;
      const children = node.children || [];
      const childrenText = children.map(child => formatNode(child, level + 1)).join('\n');
      return childrenText ? `${text}\n${childrenText}` : text;
    };
    return formatNode(mindMap);
  }
};

// Content validation utilities
export const contentValidation = {
  // Validate mind map structure
  validateMindMap: (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!data) {
      errors.push('Mind map data is required');
      return { isValid: false, errors };
    }
    
    if (typeof data !== 'object') {
      errors.push('Mind map data must be an object');
      return { isValid: false, errors };
    }
    
    if (!data.topic || typeof data.topic !== 'string') {
      errors.push('Mind map must have a topic property');
    }
    
    if (!Array.isArray(data.children)) {
      errors.push('Mind map children must be an array');
    } else {
      data.children.forEach((child: any, index: number) => {
        if (!child.topic || typeof child.topic !== 'string') {
          errors.push(`Child node ${index} must have a topic`);
        }
        if (!Array.isArray(child.children)) {
          errors.push(`Child node ${index} children must be an array`);
        }
      });
    }
    
    return { isValid: errors.length === 0, errors };
  },

  // Validate mermaid syntax
  validateMermaid: (code: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!code || typeof code !== 'string') {
      errors.push('Mermaid code is required');
      return { isValid: false, errors };
    }
    
    // Check for common syntax issues
    if (!code.trim()) {
      errors.push('Mermaid code cannot be empty');
    }
    
    // Basic validation - check for common patterns
    const validStarters = ['graph', 'flowchart', 'sequenceDiagram', 'gantt', 'stateDiagram', 'journey', 'classDiagram', 'erDiagram'];
    const hasValidStart = validStarters.some(starter => code.trim().startsWith(starter));
    
    if (!hasValidStart) {
      errors.push('Mermaid code must start with a valid diagram type');
    }
    
    // Check for balanced brackets (basic validation)
    const brackets = { '[': 0, ']': 0, '{': 0, '}': 0, '(': 0, ')': 0 };
    for (const char of code) {
      if (brackets.hasOwnProperty(char)) {
        brackets[char as keyof typeof brackets]++;
      }
    }
    
    if (brackets['['] !== brackets[']'] || brackets['{'] !== brackets['}'] || brackets['('] !== brackets[')']) {
      errors.push('Unbalanced brackets in Mermaid code');
    }
    
    return { isValid: errors.length === 0, errors };
  },

  // Validate LaTeX content
  validateLatex: (content: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!content || typeof content !== 'string') {
      errors.push('LaTeX content is required');
      return { isValid: false, errors };
    }
    
    // Check for math delimiters
    const hasMathContent = content.includes('$') || content.includes('\\(') || content.includes('\\[') || content.includes('$$');
    
    if (!hasMathContent) {
      errors.push('LaTeX content should contain math delimiters ($...$, $$...$$, \\(...\\), or \\[...\\])');
    }
    
    // Basic bracket matching
    const brackets = { '{': 0, '}': 0, '[': 0, ']': 0 };
    for (const char of content) {
      if (brackets.hasOwnProperty(char)) {
        brackets[char as keyof typeof brackets]++;
      }
    }
    
    if (brackets['{'] !== brackets['}'] || brackets['['] !== brackets[']']) {
      errors.push('Unbalanced brackets in LaTeX content');
    }
    
    return { isValid: errors.length === 0, errors };
  },

  // Auto-detect content type and validate
  detectAndValidate: (content: string, suggestedType: MockNote['content_type']): {
    isValid: boolean;
    detectedType: MockNote['content_type'];
    errors: string[];
  } => {
    // Auto-detect if type is not specified
    let detectedType = suggestedType;
    
    if (suggestedType === 'plain-text') {
      detectedType = contentValidation.autoDetectType(content);
    }
    
    let validationResult = { isValid: true, errors: [] as string[] };
    
    switch (detectedType) {
      case 'mind-map':
        validationResult = contentValidation.validateMindMap(content);
        break;
      case 'mermaid':
        validationResult = contentValidation.validateMermaid(content);
        break;
      case 'math':
        validationResult = contentValidation.validateLatex(content);
        break;
      case 'rich-text':
        // Basic HTML validation
        if (content && !content.includes('<') && !content.includes('>')) {
          validationResult = {
            isValid: false,
            errors: ['Rich text content appears to be plain text. Consider using plain-text mode.']
          };
        }
        break;
    }
    
    return {
      ...validationResult,
      detectedType
    };
  },

  // Auto-detect content type based on content
  autoDetectType: (content: string): MockNote['content_type'] => {
    if (!content || typeof content !== 'string') {
      return 'plain-text';
    }
    
    // Check for mind map structure
    try {
      const parsed = JSON.parse(content);
      if (parsed && parsed.topic && Array.isArray(parsed.children)) {
        return 'mind-map';
      }
    } catch {}
    
    // Check for mermaid diagrams
    const mermaidStarters = ['graph', 'flowchart', 'sequenceDiagram', 'gantt', 'stateDiagram', 'journey', 'classDiagram', 'erDiagram'];
    const trimmed = content.trim();
    if (mermaidStarters.some(starter => trimmed.startsWith(starter))) {
      return 'mermaid';
    }
    
    // Check for LaTeX math
    if (content.includes('$') || content.includes('\\(') || content.includes('\\[') || content.includes('$$')) {
      return 'math';
    }
    
    // Check for HTML
    if (content.includes('<') && content.includes('>')) {
      return 'rich-text';
    }
    
    // Check for markdown code blocks
    if (content.includes('```')) {
      return 'syntax-highlight';
    }
    
    // Check for code patterns
    const codePatterns = [
      /\bfunction\s+\w+/,
      /\bconst\s+\w+\s*=/,
      /\blet\s+\w+\s*=/,
      /\bvar\s+\w+\s*=/,
      /\bclass\s+\w+/,
      /\bimport\s+/,
      /\bexport\s+/,
      /\bdef\s+\w+/,
      /\bpublic\s+\w+/,
      /\bprivate\s+\w+/
    ];
    
    if (codePatterns.some(pattern => pattern.test(content))) {
      return 'code';
    }
    
    return 'plain-text';
  }
};

// Content transformation utilities
export const contentTransform = {
  // Convert content from one type to another
  transformContent: (
    content: string, 
    fromType: MockNote['content_type'], 
    toType: MockNote['content_type']
  ): { success: boolean; content: string; error?: string } => {
    try {
      switch (fromType) {
        case 'plain-text':
          return contentTransform.fromPlainText(content, toType);
        case 'rich-text':
          return contentTransform.fromRichText(content, toType);
        case 'code':
          return contentTransform.fromCode(content, toType);
        case 'syntax-highlight':
          return contentTransform.fromSyntaxHighlight(content, toType);
        case 'mind-map':
          return contentTransform.fromMindMap(content, toType);
        case 'mermaid':
          return contentTransform.fromMermaid(content, toType);
        case 'math':
          return contentTransform.fromMath(content, toType);
        default:
          return { success: false, content: '', error: 'Unknown source type' };
      }
    } catch (error) {
      return { success: false, content: '', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Transform from plain text
  fromPlainText: (content: string, toType: MockNote['content_type']) => {
    switch (toType) {
      case 'rich-text':
        return {
          success: true,
          content: content.split('\n').map(line => `<p>${line}</p>`).join('')
        };
      case 'code':
        return {
          success: true,
          content: content
        };
      case 'syntax-highlight':
        return {
          success: true,
          content: `\`\`\`\n${content}\n\`\`\``
        };
      case 'mind-map':
        return {
          success: true,
          content: JSON.stringify({
            topic: 'Central Topic',
            children: content.split('\n').filter(line => line.trim()).map(line => ({
              topic: line.trim(),
              children: []
            }))
          }, null, 2)
        };
      case 'mermaid':
        return {
          success: true,
          content: `graph TD\n    A[${content.split('\n')[0] || 'Start'}] --> B[End]`
        };
      case 'math':
        return {
          success: true,
          content: `$${content}$`
        };
      default:
        return { success: true, content };
    }
  },

  // Transform from rich text
  fromRichText: (content: string, toType: MockNote['content_type']) => {
    const plainText = content.replace(/<[^>]*>/g, '');
    
    switch (toType) {
      case 'plain-text':
        return { success: true, content: plainText };
      case 'code':
        return { success: true, content: plainText };
      case 'syntax-highlight':
        return { success: true, content: `\`\`\`\n${plainText}\n\`\`\`` };
      case 'mind-map':
        return contentTransform.fromPlainText(plainText, toType);
      default:
        return { success: true, content };
    }
  },

  // Transform from code
  fromCode: (content: string, toType: MockNote['content_type']) => {
    switch (toType) {
      case 'syntax-highlight':
        return { success: true, content: `\`\`\`\n${content}\n\`\`\`` };
      case 'rich-text':
        return { success: true, content: `<pre><code>${content}</code></pre>` };
      case 'plain-text':
        return { success: true, content };
      default:
        return { success: true, content };
    }
  },

  // Transform from syntax highlight
  fromSyntaxHighlight: (content: string, toType: MockNote['content_type']) => {
    // Extract code from markdown code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const matches = [...content.matchAll(codeBlockRegex)];
    const extractedCode = matches.map(match => match[2] || '').join('\n\n');
    
    switch (toType) {
      case 'code':
        return { success: true, content: extractedCode };
      case 'rich-text':
        return { success: true, content: `<pre><code>${extractedCode}</code></pre>` };
      case 'plain-text':
        return { success: true, content: extractedCode };
      default:
        return { success: true, content };
    }
  },

  // Transform from mind map
  fromMindMap: (content: string, toType: MockNote['content_type']) => {
    try {
      const mindMap = JSON.parse(content);
      const plainText = mindMapUtils.mindMapToPlainText(mindMap);
      
      switch (toType) {
        case 'plain-text':
          return { success: true, content: plainText };
        case 'rich-text':
          return { success: true, content: `<h1>${mindMap.topic}</h1>${plainText.split('\n').map(line => `<p>${line}</p>`).join('')}` };
        default:
          return { success: true, content: content };
      }
    } catch (error) {
      return { success: false, content: '', error: 'Invalid mind map format' };
    }
  },

  // Transform from mermaid
  fromMermaid: (content: string, toType: MockNote['content_type']) => {
    switch (toType) {
      case 'plain-text':
        return { success: true, content };
      case 'rich-text':
        return { success: true, content: `<pre><code>${content}</code></pre>` };
      default:
        return { success: true, content };
    }
  },

  // Transform from math
  fromMath: (content: string, toType: MockNote['content_type']) => {
    const plainText = content.replace(/\$\$?/g, '');
    
    switch (toType) {
      case 'plain-text':
        return { success: true, content: plainText };
      case 'rich-text':
        return { success: true, content: `<div>$${content}$$</div>` };
      default:
        return { success: true, content };
    }
  }
};