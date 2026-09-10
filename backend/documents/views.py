from django.shortcuts import render

def incoming_list(request):
    """Quản lý Văn bản Đến (Mục 2.1 - Nhóm 2)"""
    context = {
        'active_menu': 'incoming_docs',
        'active_group': 'documents',
        'page_title': 'Danh sách Văn bản Đến',
    }
    return render(request, 'documents/incoming_list.html', context)

def outgoing_list(request):
    """Quản lý Văn bản Đi (Mục 2.2 - Nhóm 2)"""
    context = {
        'active_menu': 'outgoing_docs',
        'active_group': 'documents',
        'page_title': 'Danh sách Văn bản Đi',
    }
    return render(request, 'documents/outgoing_list.html', context)

def confidential_list(request):
    """Quản lý Văn bản Mật & Khẩn (Mục 2.3 - Nhóm 2)"""
    context = {
        'active_menu': 'confidential_docs',
        'active_group': 'documents',
        'page_title': 'Danh sách Văn bản Mật & Hỏa Tốc',
    }
    return render(request, 'documents/confidential_list.html', context)
