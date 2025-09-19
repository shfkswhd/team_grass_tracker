/* ************************************************************************** */
/*                                                                            */
/*                                                      :::    :::    :::     */
/*   Problem Number: 28235                             :+:    :+:      :+:    */
/*                                                    +:+    +:+        +:+   */
/*   By: jack0969 <boj.kr/u/jack0969>                +#+    +#+          +#+  */
/*                                                  +#+      +#+        +#+   */
/*   https://boj.kr/28235                          #+#        #+#      #+#    */
/*   Solved: 2025/09/10 21:17:59 by jack0969      ###          ###   ##.kr    */
/*                                                                            */
/* ************************************************************************** */
#include <iostream>
#include <string>
using namespace std;

int main(){
    string s;
    cin >>s;
    if(s=="SONGDO") cout <<"HIGHSCHOOL";
    else if(s=="CODE") cout <<"MASTER";
    else if(s=="2023") cout <<"0611";
    else if(s=="ALGORITHM") cout <<"CONTEST";
    return 0;
}