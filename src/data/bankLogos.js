export const bankLogos = {
  'Touch n Go': '/logos/tng.png',
  TnG: '/logos/tng.png',
  Affin: '/logos/affin.png',
  'Hong Leong': '/logos/hong-leong.png',
  HLB: '/logos/hong-leong.png',
  RHB: '/logos/rhb.png',
  'Public Bank': '/logos/public-bank.gif',
  PBB: '/logos/public-bank.gif',
  Maybank: '/logos/maybank.png',
}

const normalizeBankName = (name = '') => String(name).trim().toLowerCase()

export const getBankLogo = (name) => {
  if (bankLogos[name]) return bankLogos[name]

  const normalizedName = normalizeBankName(name)

  if (normalizedName.includes('hong') || normalizedName.includes('leong')) return bankLogos['Hong Leong']
  if (normalizedName.includes('public')) return bankLogos['Public Bank']
  if (normalizedName.includes('affin')) return bankLogos.Affin
  if (normalizedName.includes('maybank')) return bankLogos.Maybank
  if (normalizedName.includes('rhb')) return bankLogos.RHB
  if (normalizedName.includes('tng') || normalizedName.includes('touch') || normalizedName.includes('go')) return bankLogos.TnG

  return null
}
