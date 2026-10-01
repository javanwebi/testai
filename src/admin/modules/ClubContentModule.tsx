import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  FileText,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  Sparkles,
  Gift,
  Check,
  Calendar,
  Image as ImageIcon,
  Tag,
  Eye,
  Sliders,
} from 'lucide-react';
import {
  adminService,
  ClubMember,
  RewardRequestItem,
  CampaignItem,
  BlogPost,
  StaticPage,
} from '../../services/adminService';
import { formatPrice, toPersianDigits } from '../../utils/formatters';

export const ClubContentModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'club' | 'blog' | 'pages'>('club');

  // Club State
  const [members, setMembers] = useState<ClubMember[]>(() => adminService.getClubMembers());
  const [rewardRequests, setRewardRequests] = useState<RewardRequestItem[]>(() =>
    adminService.getRewardRequests()
  );
  const [campaigns, setCampaigns] = useState<CampaignItem[]>(() => adminService.getCampaigns());

  // Blog State
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(() => adminService.getBlogPosts());
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);

  // Static Pages State
  const [staticPages, setStaticPages] = useState<StaticPage[]>(() => adminService.getStaticPages());
  const [selectedPage, setSelectedPage] = useState<StaticPage | null>(() =>
    adminService.getStaticPages()[0] || null
  );

  const refreshData = () => {
    setMembers(adminService.getClubMembers());
    setRewardRequests(adminService.getRewardRequests());
    setCampaigns(adminService.getCampaigns());
    setBlogPosts(adminService.getBlogPosts());
    setStaticPages(adminService.getStaticPages());
  };

  const handleRewardAction = (reqId: string, status: 'approved' | 'rejected') => {
    adminService.updateRewardStatus(reqId, status);
    refreshData();
  };

  const handleSaveCampaign = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const title = (form.elements.namedItem('campTitle') as HTMLInputElement).value;
    const multiplier = Number((form.elements.namedItem('campMult') as HTMLInputElement).value);
    const validUntil = (form.elements.namedItem('campDate') as HTMLInputElement).value;

    adminService.saveCampaign({
      id: 'camp-' + Date.now(),
      title,
      multiplier,
      validUntil,
      active: true,
    });
    refreshData();
    form.reset();
  };

  const handleSavePost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const title = (form.elements.namedItem('postTitle') as HTMLInputElement).value;
    const slug = (form.elements.namedItem('postSlug') as HTMLInputElement).value;
    const category = (form.elements.namedItem('postCat') as HTMLInputElement).value;
    const imageUrl = (form.elements.namedItem('postImg') as HTMLInputElement).value;
    const tags = (form.elements.namedItem('postTags') as HTMLInputElement).value;
    const content = (form.elements.namedItem('postContent') as HTMLTextAreaElement).value;

    const postPayload: BlogPost = {
      id: editingPost?.id || 'post-' + Date.now(),
      title,
      slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
      category,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80',
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      content,
      published: true,
      createdAt: editingPost?.createdAt || new Date().toLocaleDateString('fa-IR'),
    };

    adminService.saveBlogPost(postPayload);
    refreshData();
    setIsBlogModalOpen(false);
    setEditingPost(null);
  };

  const handleSavePage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPage) return;
    adminService.saveStaticPage(selectedPage);
    refreshData();
    alert('محتوای صفحه ثابت با موفقیت ذخیره و منتشر گردید.');
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#55565A] flex items-center gap-2">
            <Award className="w-6 h-6 text-[#E06518]" />
            <span>باشگاه مشتریان، تولید محتوا و صفحات وب</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            مدیریت سطوح وفاداری و جوایز اعضا، تعریف کمپین‌های فصلی، مقالات تخصصی مهندسی تسمه و صفحات ثابت سایت.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'blog' && (
            <button
              onClick={() => {
                setEditingPost(null);
                setIsBlogModalOpen(true);
              }}
              className="py-2.5 px-4 rounded-xl bg-[#55565A] text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#E06518]" />
              <span>نگارش مقاله جدید</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('club')}
          className={`py-2 px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'club'
              ? 'bg-[#55565A] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>باشگاه و جوایز وفاداری</span>
        </button>

        <button
          onClick={() => setActiveTab('blog')}
          className={`py-2 px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'blog'
              ? 'bg-[#55565A] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>وبلاگ و مقالات تخصصی ({toPersianDigits(blogPosts.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('pages')}
          className={`py-2 px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'pages'
              ? 'bg-[#55565A] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>صفحات ثابت (درباره ما، قوانین و...)</span>
        </button>
      </div>

      {/* --- TAB 1: CLUB & REWARDS --- */}
      {activeTab === 'club' && (
        <div className="space-y-6">
          {/* Active Campaigns Row */}
          <div className="p-5 rounded-3xl bg-orange-50/70 border border-orange-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#E06518]" />
                <h3 className="font-black text-sm text-[#55565A]">کمپین‌های فعال با ضریب امتیاز باشگاه</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {campaigns.map(c => (
                <div key={c.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#55565A]">{c.title}</span>
                    <span className="font-mono font-black text-sm text-[#C95210] bg-orange-100 px-2 py-0.5 rounded-lg">
                      {toPersianDigits(c.multiplier)}X امتیاز
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">مهلت اعتبار: {c.validUntil}</div>
                </div>
              ))}

              {/* Add New Campaign Form */}
              <form onSubmit={handleSaveCampaign} className="p-4 rounded-2xl bg-white border border-dashed border-orange-300 space-y-2 text-xs">
                <div className="font-bold text-[#C95210]">تعریف کمپین جدید:</div>
                <input
                  type="text"
                  name="campTitle"
                  required
                  placeholder="عنوان کمپین (مثلاً جشنواره پاییزه)..."
                  className="w-full h-8 px-2.5 rounded-lg border border-slate-200 outline-none"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="campMult"
                    defaultValue={2}
                    min={1}
                    max={5}
                    className="w-16 h-8 px-2 rounded-lg border border-slate-200 font-mono text-center outline-none"
                  />
                  <input
                    type="text"
                    name="campDate"
                    defaultValue="۳۰ مهر ۱۴۰۳"
                    className="flex-1 h-8 px-2 rounded-lg border border-slate-200 outline-none"
                  />
                  <button
                    type="submit"
                    className="h-8 px-3 rounded-lg bg-[#55565A] text-white font-bold cursor-pointer"
                  >
                    افزودن
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Reward Redemption Requests */}
          <div className="space-y-3">
            <h3 className="font-black text-sm text-[#55565A] flex items-center gap-2">
              <Gift className="w-4 h-4 text-[#E06518]" />
              <span>درخواست‌های دریافت جایزه اعضا</span>
            </h3>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-[#55565A]">
                    <th className="py-3 px-4">کد درخواست</th>
                    <th className="py-3 px-4">عضو متقاضی</th>
                    <th className="py-3 px-4">عنوان جایزه درخواستی</th>
                    <th className="py-3 px-4">امتیاز کسر شده</th>
                    <th className="py-3 px-4">تاریخ ثبت</th>
                    <th className="py-3 px-4">وضعیت</th>
                    <th className="py-3 px-4 text-center">اقدام</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rewardRequests.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#55565A]">{r.id}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#55565A]">{r.memberName}</div>
                        <div className="text-[10px] text-slate-400">{r.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#C95210]">{r.rewardTitle}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {toPersianDigits(r.pointsCost)} امتیاز
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">{r.createdAt}</td>
                      <td className="py-3.5 px-4">
                        {r.status === 'pending' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            در انتظار ارسال
                          </span>
                        )}
                        {r.status === 'approved' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            ارسال شد
                          </span>
                        )}
                        {r.status === 'rejected' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-800 border border-red-200">
                            رد شد
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {r.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleRewardAction(r.id, 'approved')}
                              className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                            >
                              تأیید و ارسال
                            </button>
                            <button
                              onClick={() => handleRewardAction(r.id, 'rejected')}
                              className="py-1 px-2.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs"
                            >
                              رد
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-bold">تکمیل شده</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Members Table */}
          <div className="space-y-3">
            <h3 className="font-black text-sm text-[#55565A]">فهرست اعضای دارای امتیاز باشگاه</h3>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-[#55565A]">
                    <th className="py-3 px-4">نام مشتری / کارخانه</th>
                    <th className="py-3 px-4">تلفن تماس</th>
                    <th className="py-3 px-4">امتیاز فعلی</th>
                    <th className="py-3 px-4">سطح وفاداری</th>
                    <th className="py-3 px-4">تاریخ عضویت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#55565A]">{m.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{m.phone}</td>
                      <td className="py-3 px-4 font-mono font-black text-[#C95210]">
                        {toPersianDigits(m.points)} امتیاز
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {m.level}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">{m.joinedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: BLOG POSTS CRUD --- */}
      {activeTab === 'blog' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blogPosts.map(post => (
              <div
                key={post.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-40 object-cover border-b border-slate-100"
                  />
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{post.category}</span>
                      <span>{post.createdAt}</span>
                    </div>
                    <h3 className="font-bold text-xs text-[#55565A] line-clamp-2 leading-relaxed">
                      {post.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {post.content}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {(post.tags || []).slice(0, 2).map((t, i) => (
                      <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        #{t}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingPost(post);
                        setIsBlogModalOpen(true);
                      }}
                      className="text-xs text-blue-600 font-bold hover:underline"
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('آیا از حذف این مقاله اطمینان دارید؟')) {
                          adminService.deleteBlogPost(post.id);
                          refreshData();
                        }
                      }}
                      className="text-xs text-red-500 font-bold hover:underline"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 3: STATIC PAGES --- */}
      {activeTab === 'pages' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-2">
            <div className="text-xs font-bold text-slate-600 mb-2">صفحات ثابت سایت:</div>
            {staticPages.map(page => (
              <button
                key={page.slug}
                onClick={() => setSelectedPage(page)}
                className={`w-full text-right p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  selectedPage?.slug === page.slug
                    ? 'bg-[#55565A] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {page.title}
              </button>
            ))}
          </div>

          <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            {selectedPage ? (
              <form onSubmit={handleSavePage} className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-black text-sm text-[#55565A]">ویرایش {selectedPage.title}</h3>
                    <span className="text-[11px] text-slate-400 font-mono">اسلاگ: /{selectedPage.slug}</span>
                  </div>
                  <button
                    type="submit"
                    className="py-2 px-5 rounded-xl bg-[#55565A] text-white font-black text-xs cursor-pointer shadow-xs"
                  >
                    ذخیره و انتشار تغییرات
                  </button>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">عنوان صفحه</label>
                  <input
                    type="text"
                    value={selectedPage.title}
                    onChange={e => setSelectedPage({ ...selectedPage, title: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">محتوای صفحه (قالب متنی / راهنما)</label>
                  <textarea
                    rows={12}
                    value={selectedPage.content}
                    onChange={e => setSelectedPage({ ...selectedPage, content: e.target.value })}
                    className="w-full p-3.5 rounded-2xl border border-slate-200 leading-relaxed outline-none focus:border-[#E06518]"
                  />
                </div>
              </form>
            ) : null}
          </div>
        </div>
      )}

      {/* --- ADD / EDIT BLOG MODAL --- */}
      {isBlogModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="bg-[#55565A] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm">
                  {editingPost ? 'ویرایش مقاله' : 'نگارش مقاله تخصصی جدید'}
                </h3>
              </div>
              <button
                onClick={() => setIsBlogModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePost} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">عنوان مقاله *</label>
                <input
                  type="text"
                  name="postTitle"
                  required
                  defaultValue={editingPost?.title || ''}
                  placeholder="مثلاً راهنمای انتخاب تسمه مناسب برای خطوط تولید کاشی..."
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">اسلاگ URL انگلیسی</label>
                  <input
                    type="text"
                    name="postSlug"
                    defaultValue={editingPost?.slug || ''}
                    placeholder="guide-to-industrial-belts"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">دسته‌بندی موضوعی</label>
                  <input
                    type="text"
                    name="postCat"
                    defaultValue={editingPost?.category || 'راهنمای فنی و مهندسی'}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">آدرس تصویر شاخص</label>
                <input
                  type="url"
                  name="postImg"
                  defaultValue={editingPost?.imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80'}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 font-mono outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">برچسب‌ها (با کاما جدا کنید)</label>
                <input
                  type="text"
                  name="postTags"
                  defaultValue={editingPost?.tags?.join(', ') || 'تسمه, صنعتی, راهنما'}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">متن کامل مقاله *</label>
                <textarea
                  name="postContent"
                  rows={6}
                  required
                  defaultValue={editingPost?.content || ''}
                  placeholder="محتوای تخصصی مقاله..."
                  className="w-full p-3 rounded-2xl border border-slate-200 leading-relaxed outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBlogModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#55565A] text-white font-black cursor-pointer"
                >
                  انتشار مقاله
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
