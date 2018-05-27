var gulp = require('gulp');
var babel = require('gulp-babel');
var del = require('del');
var less = require('gulp-less');
var path = require('path');

// Compile JSX for production
gulp.task('jsx', function() {
  return gulp.src([
      'static/js/bundle/*.jsx',
      'static/js/worksheet/*.jsx',
      'static/js/account/*.jsx',
      'static/js/common/*.jsx'
    ])
    .pipe(babel({presets: ['react']}))
    .pipe(gulp.dest('static/dist'));
});

// Compile LESS for production
gulp.task('less', function () {
  return gulp.src('static/less/imports.less')
    .pipe(less({
      paths: [ path.join(__dirname, 'less', 'includes') ]
    }))
    .pipe(gulp.dest('static/css'));
});

// Watches files and runs compile tasks if they are changed
gulp.task('watch', function(){
  gulp.watch('static/js/**/*.jsx', ['jsx']);
  gulp.watch('static/less/*.less', ['less']);
})


// Cleanup compiled jsx
gulp.task('clean', function() {
    del(['static/dist']);
    del(['static/css/imports.css']);
});
