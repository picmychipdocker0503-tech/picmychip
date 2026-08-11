import React from 'react'

export const BeforeLogin: React.FC = () => {
  return (
    <div className="border-base-content/15 bg-base-100/30 pmc-rounded-box mb-2 border p-4 text-sm shadow-md backdrop-blur-md">
      <p className="m-0">
        <strong>Picmychip Admin</strong> — sign in to manage products, orders, and site content. Customers should{' '}
        <a className="pmc-link" href={`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/login`}>
          log in on the storefront
        </a>{' '}
        instead, to access their own account and order history.
      </p>
    </div>
  )
}
