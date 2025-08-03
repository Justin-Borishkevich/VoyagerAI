const model = require('../models/user');

exports.signup = (req, res)=>{
    res.render('./users/signup', { 
                        currentPage: 'signup', 
                        extraStyles: '/css/signup.css'
                    });
};

exports.create = (req, res, next)=>{
    let user = new model(req.body);
    user.save()
    .then(user=> {
        req.flash('success', 'You have successfully signed up');
        res.redirect('/users/login');
    })
    .catch(err=>{
        if(err.name === 'ValidationError' ) {
            req.flash('error', err.message);  
            return res.redirect('/users/signup');
        }

        if (err.code === 11000) {
            req.flash('error', 'Email has already been used');
            return res.redirect('/users/signup');
        }

        if (err.message.includes('this email address has been used')) {
            req.flash('error', 'Email has been used');
            return res.redirect('/users/signup');
        }
        
        next(err);
    }); 
};

exports.getUserLogin = (req, res, next) => {
    res.render('./users/login', { 
                    currentPage: 'login', 
                    extraStyles: '/css/login.css'
                });
}

exports.login = (req, res, next)=>{

    let email = req.body.email.toLowerCase();
    let password = req.body.password;
    model.findOne({ email: email })
    .then(user => {
        if (!user) {
            console.log('wrong email address');
            req.flash('error', 'wrong email address');  
            res.redirect('/users/login');
            } else {
            user.comparePassword(password)
            .then(result=>{
                if(result) {
                    req.session.user = user._id;
                    req.flash('success', 'You have successfully logged in');
                    res.redirect('/users/profile');
            } else {
                console.log('wrong wrong password');
                req.flash('error', 'wrong password');      
                res.redirect('/users/login');
            }
            });     
        }     
    })
    .catch(err => next(err));
};

exports.profile = (req, res, next)=>{
    let id = req.session.user;
    Promise.all([model.findById(id)])
    .then(results => {
        const [user] = results;
        res.render('./users/profile', {
            user,
            currentPage: 'profile',
            extraStyles: '/css/profile.css'
        });
    })
    .catch(err => next(err));
};

exports.logout = (req, res, next)=>{
    req.session.destroy(err=>{
        if(err) 
           return next(err);
       else
            res.redirect('/');  
    });
 };

 exports.deleteUser = async (req, res, next) => {
    try {
        const userId = req.session.user;

        // Remove the user from the database
        await model.findByIdAndDelete(userId);

        // Destroy the session
        req.session.destroy(err => {
            if (err) return next(err);
            res.redirect('/users/login');
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};
