function generateInsights(items) {
  const totalItems = items.length;
  const typeCounts = items.reduce((acc, item) => {
    const type = (item.type || 'uncategorized').toLowerCase();
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  let topCategory = 'None';
  let maxCount = 0;
  for (const [type, count] of Object.entries(typeCounts)) {
    if (count > maxCount) {
      topCategory = type;
      maxCount = count;
    }
  }

  const riskLevel = totalItems > 50 ? 'Low' : 'Minimal';
  const summaryText = `Your Vault contains ${totalItems} encrypted items. The dominant category is ${topCategory}.`;

  return {
    totalItems,
    topCategory,
    riskLevel,
    summaryText
  };
}

module.exports = { generateInsights };
