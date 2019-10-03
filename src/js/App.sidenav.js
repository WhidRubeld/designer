let sidenav = {
    isOpen: false,
    init: function (opt) {
        if (this.isOpen) return false;

        this.isForm = opt.isForm || false;
        this.name = opt.name || 'sidenav';
        this.title = opt.title;
        this.content = opt.content;
        this.position = opt.position || 'left';
        this.submitText = opt.submitText || 'Отправить';
        this.onOpen = opt.onOpen;
        this.onClose = opt.onClose;
        this.onSubmit = this.isForm ? opt.onSubmit : false;

        this.$instance = $(App.templates.sidenav({
            isForm: this.isForm,
            name: this.name,
            title: this.title,
            content: this.content,
            submitText: this.submitText
        })).appendTo('body');

        var self = this;

        this.$instance.sidenav({
            edge: this.position,
            draggable: false,
            onOpenEnd: function () {
                if (self.onOpen) {
                    self.onOpen();
                }
            },
            onCloseEnd: function () {
                self.reset();
            }
        });

        $('.sidenav-overlay').on('click', function () {
            if(self.isOpen) {
                self.$instance.sidenav('close');
            }
        });

        if (this.isForm) {
            this.$instance.find('form').on('submit', function (e) {
                e.preventDefault();
                var data = new FormData(this);

                if (self.onSubmit(data)) {
                    self.$instance.sidenav('close');
                }
            });
        }

        this.$instance.sidenav('open');
        this.isOpen = true;
    },
    updateTitle: function (title) {
        if (!this.isOpen || !this.title) return false;
        this.title = title;
        this.$instance.find('.flow-text').html(this.title);
    },
    updateContent: function (content) {
        if (!this.isOpen) return false;
        this.content = content;
        this.$instance.find('.content').html(this.content);
    },
    reset: function (onClose) {
        if (!this.isOpen) return false;

        if (this.onClose) this.onClose(this.$instance);

        this.$instance.sidenav('destroy').remove();

        delete this.isForm;
        delete this.name;
        delete this.title;
        delete this.content;
        delete this.submitText;
        delete this.position;
        delete this.onOpen;
        delete this.onClose;
        delete this.onSubmit;
        delete this.$instance;
        this.isOpen = false;
    }
};

export {sidenav};