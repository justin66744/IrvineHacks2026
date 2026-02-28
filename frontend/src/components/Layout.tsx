import { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import styles from './Layout.module.css'

type LayoutProps = { children: ReactNode }

export default function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <NavLink to="/" className={styles.logo}>First-Mover Alert</NavLink>
        <nav className={styles.nav}>
          <NavLink to="/" end className={({ isActive }) => (isActive ? styles.active : '')}>Home</NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? styles.active : '')}>Risk Score</NavLink>
          <NavLink to="/listings" className={({ isActive }) => (isActive ? styles.active : '')}>Listings</NavLink>
          <NavLink to="/alerts" className={({ isActive }) => (isActive ? styles.active : '')}>Alerts</NavLink>
          <NavLink to="/assistance" className={({ isActive }) => (isActive ? styles.active : '')}>Assistance</NavLink>
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  )
}
