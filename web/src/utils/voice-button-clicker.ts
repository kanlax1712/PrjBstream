/**
 * Utility functions to programmatically click buttons via voice commands
 */

export function clickButtonByText(text: string, exact = false): boolean {
  const buttons = Array.from(document.querySelectorAll('button, a[href], [role="button"]'));
  
  for (const button of buttons) {
    const buttonText = button.textContent?.toLowerCase().trim() || '';
    const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
    const title = button.getAttribute('title')?.toLowerCase() || '';
    
    const searchText = text.toLowerCase().trim();
    
    if (exact) {
      if (buttonText === searchText || ariaLabel === searchText || title === searchText) {
        (button as HTMLElement).click();
        return true;
      }
    } else {
      if (buttonText.includes(searchText) || ariaLabel.includes(searchText) || title.includes(searchText)) {
        (button as HTMLElement).click();
        return true;
      }
    }
  }
  
  return false;
}

export function clickButtonByAriaLabel(label: string): boolean {
  const button = document.querySelector(`button[aria-label*="${label}" i], [role="button"][aria-label*="${label}" i]`) as HTMLElement;
  if (button) {
    button.click();
    return true;
  }
  return false;
}

export function clickLinkByHref(href: string): boolean {
  const link = document.querySelector(`a[href="${href}"], a[href*="${href}"]`) as HTMLElement;
  if (link) {
    link.click();
    return true;
  }
  return false;
}

export function clickButtonByClassName(className: string): boolean {
  const button = document.querySelector(`button.${className}, .${className}[role="button"]`) as HTMLElement;
  if (button) {
    button.click();
    return true;
  }
  return false;
}

export function focusAndClickSearchInput(): boolean {
  const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]') as HTMLInputElement;
  if (searchInput) {
    searchInput.focus();
    searchInput.click();
    return true;
  }
  return false;
}

export function clickUserMenuButton(): boolean {
  // Try multiple strategies to find user menu button
  const strategies = [
    () => document.querySelector('button:has(img[alt*="avatar" i])') as HTMLElement,
    () => document.querySelector('button:has(img[alt*="user" i])') as HTMLElement,
    () => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => {
        const img = btn.querySelector('img');
        return img && (btn.textContent?.includes('@') || btn.closest('[class*="user"]'));
      }) as HTMLElement;
    },
    () => {
      // Find button with user avatar image
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => {
        const hasImage = btn.querySelector('img');
        const hasText = btn.textContent && btn.textContent.length > 0;
        return hasImage && hasText;
      }) as HTMLElement;
    },
  ];

  for (const strategy of strategies) {
    const button = strategy();
    if (button) {
      button.click();
      return true;
    }
  }
  
  return false;
}

export function clickSubscribeButton(): boolean {
  const strategies = [
    () => document.querySelector('button[aria-label*="subscribe" i]') as HTMLElement,
    () => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => 
        btn.textContent?.toLowerCase().includes('subscribe')
      ) as HTMLElement;
    },
    () => {
      // Look for subscribe button in video player area
      const videoArea = document.querySelector('[class*="video"]') || document.body;
      const buttons = Array.from(videoArea.querySelectorAll('button'));
      return buttons.find(btn => 
        btn.textContent?.toLowerCase().includes('subscribe')
      ) as HTMLElement;
    },
  ];

  for (const strategy of strategies) {
    const button = strategy();
    if (button) {
      button.click();
      return true;
    }
  }
  
  return false;
}

export function clickLikeButton(): boolean {
  const strategies = [
    () => document.querySelector('button[aria-label*="like" i]') as HTMLElement,
    () => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
        return text.includes('like') || ariaLabel.includes('like');
      }) as HTMLElement;
    },
  ];

  for (const strategy of strategies) {
    const button = strategy();
    if (button) {
      button.click();
      return true;
    }
  }
  
  return false;
}

export function clickDislikeButton(): boolean {
  const strategies = [
    () => document.querySelector('button[aria-label*="dislike" i]') as HTMLElement,
    () => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
        return text.includes('dislike') || ariaLabel.includes('dislike');
      }) as HTMLElement;
    },
  ];

  for (const strategy of strategies) {
    const button = strategy();
    if (button) {
      button.click();
      return true;
    }
  }
  
  return false;
}

