import affinLogo from '../assets/banks/affin.png'
import hongLeongLogo from '../assets/banks/hongleong.png'
import maybankLogo from '../assets/banks/maybank.png'
import publicBankLogo from '../assets/banks/publicbank.gif'
import rhbLogo from '../assets/banks/rhb.png'
import tngLogo from '../assets/banks/tng.png'

export const bankLogos = {
  'Touch n Go': tngLogo,
  Affin: affinLogo,
  'Hong Leong': hongLeongLogo,
  RHB: rhbLogo,
  'Public Bank': publicBankLogo,
  Maybank: maybankLogo,
}

const normalizeBankName = (name = '') => name.toLowerCase()

export const getBankLogo = (name) => {
  const normalizedName = normalizeBankName(name)

  if (normalizedName.includes('hong') || normalizedName.includes('leong')) return hongLeongLogo
  if (normalizedName.includes('public')) return publicBankLogo
  if (normalizedName.includes('affin')) return affinLogo
  if (normalizedName.includes('maybank')) return maybankLogo
  if (normalizedName.includes('rhb')) return rhbLogo
  if (normalizedName.includes('tng') || normalizedName.includes('touch') || normalizedName.includes('go')) return tngLogo

  return null
}
