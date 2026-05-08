export const IdentityManager = {
  /**
   * Generates a short guest code like "#G-123"
   */
  generateAlias: () => {
    const num = Math.floor(100 + Math.random() * 899); // 3 digit number
    return `#G-${num}`;
  }
};
