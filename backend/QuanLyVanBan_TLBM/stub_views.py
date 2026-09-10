from django.shortcuts import render

def stub_page(request, module_title, module_desc, group_name):
    context = {
        'module_title': module_title,
        'module_desc': module_desc,
        'group_name': group_name,
    }
    return render(request, 'common/module_in_progress.html', context)
