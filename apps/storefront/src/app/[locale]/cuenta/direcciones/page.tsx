import { setRequestLocale } from 'next-intl/server'

import { AddressBook } from '@/components/account/address-book'

interface AddressesPageProps {
  params: Promise<{ locale: string }>
}

export default async function AddressesPage({ params }: AddressesPageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <AddressBook />
}
