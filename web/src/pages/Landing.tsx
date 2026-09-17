import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Category } from '../api/client'

const features = [
  {
    title: 'Đăng việc trong 1 phút',
    body: 'Mô tả công việc, chọn danh mục và ngân sách — người làm quanh bạn sẽ nhận việc ngay.',
  },
  {
    title: 'Ký quỹ an toàn',
    body: 'Tiền được GiGood giữ trong ví ký quỹ và chỉ giải ngân khi công việc hoàn thành đúng thoả thuận.',
  },
  {
    title: 'Trò chuyện trực tiếp',
    body: 'Trao đổi với người làm qua chat trong ứng dụng, thống nhất giá và thời gian trước khi bắt đầu.',
  },
]

export default function Landing() {
  const [categories, setCategories] = useState<Category[]>([])

  // Public endpoint; the landing must still render when the API is down.
  useEffect(() => {
    let active = true
    api
      .get<Category[]>('/api/meta/categories')
      .then((response) => {
        if (active) setCategories(response.data)
      })
      .catch(() => {
        if (active) setCategories([])
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="landing">
      <header className="site-header container">
        <span className="brand">GiGood</span>
        <nav className="site-nav">
          <a href="#features">Tính năng</a>
          <Link to="/login">Dành cho quản trị</Link>
        </nav>
      </header>

      <section className="hero container">
        <p className="hero-kicker">Chợ việc vặt quanh bạn</p>
        <h1>
          GiGood — <span className="text-orange">việc gì cũng có người làm</span>
        </h1>
        <p className="hero-sub">
          Đăng việc, ký quỹ an toàn, trò chuyện và thanh toán minh bạch. GiGood kết nối bạn với
          người làm việc đáng tin cậy ngay trong khu vực.
        </p>
        <div className="hero-actions">
          <Link className="btn btn-primary" to="/login">
            Dùng thử app
          </Link>
          <a className="btn btn-outline" href="#">
            Tải APK
          </a>
        </div>
        {categories.length > 0 && (
          <div className="chips" aria-label="Danh mục dịch vụ">
            {categories.map((category) => (
              <span className="chip" key={category.key}>
                {category.label}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="features container" id="features">
        {features.map((feature) => (
          <article className="card feature-card" key={feature.title}>
            <h2>{feature.title}</h2>
            <p>{feature.body}</p>
          </article>
        ))}
      </section>

      <footer className="site-footer">
        <div className="container">
          <span className="brand">GiGood</span>
          <p>Đồ án EXE201 — nền tảng kết nối người cần việc và người làm việc.</p>
        </div>
      </footer>
    </div>
  )
}
